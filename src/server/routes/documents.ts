/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Academic Document Library Routes (/api/v1/documents)
 * Handles multi-format submissions, magic-byte validation, secure streaming downloads,
 * course-scoped reviews, and self-review restriction enforcement.
 */

import crypto from 'crypto';
import { Response, Router } from 'express';
import multer from 'multer';
import type { AcademicDocument, AccessLevel, DocumentCategory, DocumentStatus } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { db } from '../db.ts';
import { StorageService } from '../storage.ts';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB max upload
});

function serializeDocument(doc: AcademicDocument & { internalFilePath: string }): AcademicDocument {
  const { internalFilePath: _internalFilePath, ...publicDocument } = doc;
  return publicDocument;
}

function serializeVisitorDocument(doc: AcademicDocument & { internalFilePath: string }): Record<string, unknown> {
  const {
    internalFilePath: _internalFilePath,
    verificationToken: _verificationToken,
    isVerified: _isVerified,
    verifiedAt: _verifiedAt,
    verifiedBy: _verifiedBy,
    fileHash: _fileHash,
    ...publicMetadata
  } = doc;
  return publicMetadata;
}

// GET /api/v1/documents
router.get('/', (req: AuthRequest, res: Response): void => {
  const { courseId, category, status, q } = req.query as Record<string, string>;

  let list = Array.from(db.documents.values());

  if (req.user?.status === 'PENDING_APPROVAL' || req.user?.status === 'REJECTED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' }
    });
    return;
  }

  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' }
    });
    return;
  }

  // Access Control Filtering
  const user = req.user;
  if (!user) {
    // Visitor: only approved & public documents
    list = list.filter(d => d.status === 'APPROVED' && d.accessLevel === 'PUBLIC');
  } else if (user.role === 'STUDENT') {
    // Student: all approved documents + own submissions
    list = list.filter(d => d.status === 'APPROVED' || d.uploaderId === user.id);
  } else if (user.role === 'LECTURER') {
    // Lecturer: approved documents + submissions in their assigned courses + their own submissions
    const assignedCourses = user.assignedCourseCodes || [];
    list = list.filter(d =>
      d.status === 'APPROVED' ||
      d.uploaderId === user.id ||
      assignedCourses.includes(d.courseCode)
    );
  }
  // Admin & Moderator see all

  // Filters
  if (courseId) {
    list = list.filter(d => d.courseId === courseId);
  }
  if (category) {
    list = list.filter(d => d.category.toUpperCase() === category.toUpperCase());
  }
  if (status && (user?.role === 'ADMINISTRATOR' || user?.role === 'MODERATOR' || user?.role === 'LECTURER')) {
    list = list.filter(d => d.status.toUpperCase() === status.toUpperCase());
  }
  if (q) {
    const term = q.toLowerCase();
    list = list.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      d.courseCode.toLowerCase().includes(term) ||
      d.verificationToken.toLowerCase().includes(term)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: list.map(doc => req.user ? serializeDocument(doc) : serializeVisitorDocument(doc)),
    meta: { total: list.length }
  });
});

// GET /api/v1/documents/:id
router.get('/:id', (req: AuthRequest, res: Response): void => {
  const doc = db.documents.get((req.params.id as string));
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  if (!req.user && doc.accessLevel === 'STUDENT_ONLY') {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Please sign in with an active student account to access this institutional resource.' }
    });
    return;
  }

  if (req.user?.status === 'PENDING_APPROVAL' || req.user?.status === 'REJECTED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' }
    });
    return;
  }

  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' }
    });
    return;
  }

  // Access check
  if (doc.status !== 'APPROVED') {
    const user = req.user;
    const isOwner = user && user.id === doc.uploaderId;
    const isPrivileged = user && ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role);
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Document is pending academic review.' } });
      return;
    }
  }

  const verification = db.documentVerifications.get(doc.id);
  const reviews = Array.from(db.documentReviews.values()).filter(r => r.documentId === doc.id);

  res.json({
    success: true,
    data: {
      ...(req.user ? serializeDocument(doc) : serializeVisitorDocument(doc)),
      ...(req.user ? { verification, reviews } : {})
    }
  });
});

// GET /api/v1/documents/:id/view (Inline streaming for browser viewing / Android PDF rendering)
router.get('/:id/view', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = db.documents.get((req.params.id as string));
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Sign in with an active account to view document files.' }
    });
    return;
  }

  if (!req.user && doc.accessLevel === 'STUDENT_ONLY') {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Please sign in with an active student account to view this institutional resource.' }
    });
    return;
  }

  if (req.user?.status === 'PENDING_APPROVAL' || req.user?.status === 'REJECTED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' }
    });
    return;
  }

  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' }
    });
    return;
  }

  // Status access control check (unpublished or restricted files)
  if (doc.status !== 'APPROVED') {
    const user = req.user;
    const isOwner = user && user.id === doc.uploaderId && doc.status !== 'RESTRICTED';
    const isPrivileged = user && ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role);
    if (!isOwner && !isPrivileged) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Document is pending academic review or restricted.' }
      });
      return;
    }
  }

  // Authorization check for STUDENT_ONLY documents
  if (doc.accessLevel === 'STUDENT_ONLY' && !req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Please sign in with your student account to view this institutional resource.' }
    });
    return;
  }

  // Suspended user check
  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended.' } });
    return;
  }

  try {
    const { buffer, mimeType } = await StorageService.getDocumentBuffer(
      doc.internalFilePath,
      doc.title,
      doc.courseCode,
      doc.verificationToken
    );

    db.logAudit(
      { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
      'DOCUMENT_VIEWED',
      'DOCUMENT',
      doc.id,
      { title: doc.title, token: doc.verificationToken },
      req.ip
    );

    const cleanAsciiFilename = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const encodedFilename = encodeURIComponent(doc.fileName);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${cleanAsciiFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-TuStudyHub-Verified-Token', doc.verificationToken);
    res.setHeader('Cache-Control', doc.accessLevel === 'STUDENT_ONLY' ? 'private, no-cache, no-store, must-revalidate' : 'public, max-age=3600');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, X-TuStudyHub-Verified-Token');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FILE_STREAM_ERROR', message: 'Error streaming protected file.' } });
  }
});

// GET /api/v1/documents/:id/download
router.get('/:id/download', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = db.documents.get((req.params.id as string));
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Sign in with an active account to download document files.' }
    });
    return;
  }

  if (!req.user && doc.accessLevel === 'STUDENT_ONLY') {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Please sign in with an active student account to download this institutional resource.' }
    });
    return;
  }

  if (req.user?.status === 'PENDING_APPROVAL' || req.user?.status === 'REJECTED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' }
    });
    return;
  }

  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' }
    });
    return;
  }

  // Status access control check (unpublished or restricted files)
  if (doc.status !== 'APPROVED') {
    const user = req.user;
    const isOwner = user && user.id === doc.uploaderId && doc.status !== 'RESTRICTED';
    const isPrivileged = user && ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role);
    if (!isOwner && !isPrivileged) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Document is pending academic review or restricted.' }
      });
      return;
    }
  }

  // Authorization check for STUDENT_ONLY documents
  if (doc.accessLevel === 'STUDENT_ONLY' && !req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_REQUIRED', message: 'Please sign in with your student account to download this institutional resource.' }
    });
    return;
  }

  // Suspended user check
  if (req.user?.status === 'SUSPENDED') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended.' } });
    return;
  }

  // Fetch file buffer from secure storage outside web root
  try {
    const { buffer, mimeType } = await StorageService.getDocumentBuffer(
      doc.internalFilePath,
      doc.title,
      doc.courseCode,
      doc.verificationToken
    );

    // Increment download counter
    doc.downloadCount += 1;

    db.logAudit(
      { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
      'DOCUMENT_DOWNLOADED',
      'DOCUMENT',
      doc.id,
      { title: doc.title, token: doc.verificationToken },
      req.ip
    );

    const cleanAsciiFilename = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const encodedFilename = encodeURIComponent(doc.fileName);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${cleanAsciiFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-TuStudyHub-Verified-Token', doc.verificationToken);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, X-TuStudyHub-Verified-Token');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FILE_STREAM_ERROR', message: 'Error streaming protected file.' } });
  }
});

// POST /api/v1/documents (Upload new academic document)
router.post('/', requireAuth, upload.single('file'), (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const { courseId, title, description, category, academicYear, accessLevel } = req.body;

  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'Academic document file is required (PDF, PNG, JPEG).' } });
    return;
  }

  if (!courseId || !title || !category) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Course, title, and document category are required.' } });
    return;
  }

  const course = db.courses.get(courseId);
  if (!course) {
    res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Selected course does not exist.' } });
    return;
  }

  // Magic-byte inspection & safe UUID file storage
  let storedFile;
  try {
    storedFile = StorageService.saveDocument(req.file.originalname, req.file.buffer);
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: (err as Error).message || 'File failed security validation.' }
    });
    return;
  }

  const docId = crypto.randomUUID();
  const token = db.generateVerificationToken(docId, course.code);

  const isLecturerOrAdmin = req.user.role === 'LECTURER' || req.user.role === 'ADMINISTRATOR';
  // Submissions default to PENDING so peer review is always respected
  const initialStatus: DocumentStatus = 'PENDING';

  const newDoc: AcademicDocument & { internalFilePath: string } = {
    id: docId,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    departmentName: course.departmentName || 'Academic Department',
    uploaderId: req.user.id,
    uploaderName: req.user.fullName,
    uploaderRole: req.user.role,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category as DocumentCategory,
    academicYear: academicYear || '2025/2026',
    fileName: storedFile.fileName,
    fileSize: storedFile.fileSize,
    mimeType: storedFile.mimeType,
    fileHash: storedFile.fileHash,
    status: initialStatus,
    accessLevel: (accessLevel as AccessLevel) || 'PUBLIC',
    downloadCount: 0,
    verificationToken: token,
    isVerified: false,
    internalFilePath: storedFile.internalFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.documents.set(newDoc.id, newDoc);

  // Create verification entry
  db.documentVerifications.set(newDoc.id, {
    id: crypto.randomUUID(),
    documentId: newDoc.id,
    verificationToken: token,
    status: 'PENDING'
  });

  db.logAudit(
    { id: req.user.id, name: req.user.fullName, role: req.user.role },
    'DOCUMENT_SUBMITTED',
    'DOCUMENT',
    newDoc.id,
    { title: newDoc.title, course: newDoc.courseCode, category: newDoc.category, hash: newDoc.fileHash },
    req.ip
  );

  res.status(201).json({
    success: true,
    data: serializeDocument(newDoc),
    message: 'Academic document submitted successfully and queued for lecturer review.'
  });
});

// POST /api/v1/documents/batch (Upload multiple academic materials for a course)
router.post('/batch', requireAuth, upload.array('files', 15), (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const { courseId, category, academicYear, accessLevel, status, titles, categories, descriptions } = req.body;

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_FILES', message: 'At least one academic document file is required.' }
    });
    return;
  }

  if (!courseId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_COURSE', message: 'Target course ID is required.' }
    });
    return;
  }

  const course = db.courses.get(courseId);
  if (!course) {
    res.status(404).json({
      success: false,
      error: { code: 'COURSE_NOT_FOUND', message: 'Target course does not exist.' }
    });
    return;
  }

  // Parse optional arrays for titles, categories, and descriptions
  let parsedTitles: string[] = [];
  let parsedCategories: string[] = [];
  let parsedDescriptions: string[] = [];
  try {
    if (titles) parsedTitles = typeof titles === 'string' ? JSON.parse(titles) : titles;
  } catch {
    parsedTitles = [];
  }
  try {
    if (categories) parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
  } catch {
    parsedCategories = [];
  }
  try {
    if (descriptions) parsedDescriptions = typeof descriptions === 'string' ? JSON.parse(descriptions) : descriptions;
  } catch {
    parsedDescriptions = [];
  }

  const isPrivileged = req.user.role === 'ADMINISTRATOR' || (
    req.user.role === 'LECTURER' && (req.user.assignedCourseCodes || []).includes(course.code)
  );

  // Approval rules:
  // General submissions must never be automatically published without review.
  // Only an Administrator or assigned Course Lecturer can publish curriculum materials directly as APPROVED if specified.
  const targetStatus: DocumentStatus = (status === 'APPROVED' && isPrivileged) ? 'APPROVED' : 'PENDING';

  const createdDocs: AcademicDocument[] = [];
  const errors: Array<{ file: string; reason: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileTitle = parsedTitles[i] || file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const fileCategory = (parsedCategories[i] || category || 'LECTURE_NOTE') as DocumentCategory;
    const fileDesc = parsedDescriptions[i] || '';

    // Check duplicate document record in same course
    const existingInCourse = Array.from(db.documents.values()).find(
      d => d.courseId === course.id && (d.fileName.toLowerCase() === file.originalname.toLowerCase())
    );
    if (existingInCourse) {
      errors.push({ file: file.originalname, reason: `Duplicate document '${file.originalname}' already exists for ${course.code}.` });
      continue;
    }

    let storedFile;
    try {
      storedFile = StorageService.saveDocument(file.originalname, file.buffer);
    } catch (err: unknown) {
      errors.push({ file: file.originalname, reason: (err as Error).message || 'Invalid format or file signature.' });
      continue;
    }

    const docId = crypto.randomUUID();
    const token = db.generateVerificationToken(docId, course.code);

    const docRecord: AcademicDocument & { internalFilePath: string } = {
      id: docId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      departmentName: course.departmentName || 'Academic Department',
      uploaderId: req.user.id,
      uploaderName: req.user.fullName,
      uploaderRole: req.user.role,
      title: fileTitle.trim(),
      description: fileDesc.trim(),
      category: fileCategory,
      academicYear: academicYear || '2025/2026',
      fileName: storedFile.fileName,
      fileSize: storedFile.fileSize,
      mimeType: storedFile.mimeType,
      fileHash: storedFile.fileHash,
      status: targetStatus,
      accessLevel: (accessLevel as AccessLevel) || 'PUBLIC',
      downloadCount: 0,
      verificationToken: token,
      isVerified: targetStatus === 'APPROVED',
      verifiedAt: targetStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      verifiedBy: targetStatus === 'APPROVED' ? req.user.fullName : undefined,
      internalFilePath: storedFile.internalFileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.documents.set(docRecord.id, docRecord);

    db.documentVerifications.set(docRecord.id, {
      id: crypto.randomUUID(),
      documentId: docRecord.id,
      verificationToken: token,
      status: targetStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING',
      verifiedBy: targetStatus === 'APPROVED' ? req.user.id : undefined,
      verifiedByName: targetStatus === 'APPROVED' ? req.user.fullName : undefined,
      verifiedAt: targetStatus === 'APPROVED' ? new Date().toISOString() : undefined
    });

    createdDocs.push(serializeDocument(docRecord));
  }

  db.logAudit(
    { id: req.user.id, name: req.user.fullName, role: req.user.role },
    'DOCUMENTS_BATCH_SUBMITTED',
    'COURSE',
    course.id,
    {
      courseCode: course.code,
      totalFiles: files.length,
      successCount: createdDocs.length,
      errorCount: errors.length,
      status: targetStatus
    },
    req.ip
  );

  res.status(createdDocs.length > 0 ? 201 : 400).json({
    success: createdDocs.length > 0,
    data: {
      created: createdDocs,
      count: createdDocs.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdDocs.length} material(s) uploaded successfully for ${course.code}.${errors.length > 0 ? ` ${errors.length} file(s) skipped.` : ''}`
    }
  });
});

// DELETE /api/v1/documents/:id (Admin or uploader of pending material)
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const doc = db.documents.get((req.params.id as string));
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  const isAdmin = req.user.role === 'ADMINISTRATOR';
  const isOwner = doc.uploaderId === req.user.id && doc.status === 'PENDING';

  if (!isAdmin && !isOwner) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only administrators or the author of a pending submission can delete this material.' }
    });
    return;
  }

  db.documents.delete(doc.id);
  db.documentVerifications.delete(doc.id);

  db.logAudit(
    { id: req.user.id, name: req.user.fullName, role: req.user.role },
    'DOCUMENT_DELETED',
    'DOCUMENT',
    doc.id,
    { title: doc.title, courseCode: doc.courseCode, fileName: doc.fileName },
    req.ip
  );

  res.json({ success: true, message: `Academic document '${doc.title}' deleted successfully.` });
});

// POST /api/v1/documents/:id/review (Lecturer/Admin Review Queue)
router.post('/:id/review', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const { decision, feedbackReason } = req.body as { decision: 'APPROVED' | 'REJECTED'; feedbackReason: string };

  const doc = db.documents.get((req.params.id as string));
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  // STRICT RULE: An author must NOT approve their own submission or revision!
  if (doc.uploaderId === req.user.id) {
    res.status(403).json({
      success: false,
      error: {
        code: 'SELF_APPROVAL_PROHIBITED',
        message: 'Academic Integrity Rule: An author is strictly prohibited from reviewing or approving their own submission.'
      }
    });
    return;
  }

  // STRICT SCOPE CHECK FOR LECTURERS: Lecturer must be assigned to this course!
  if (req.user.role === 'LECTURER') {
    const isAssigned = (req.user.assignedCourseCodes || []).includes(doc.courseCode);
    if (!isAssigned) {
      res.status(403).json({
        success: false,
        error: {
          code: 'OUT_OF_COURSE_SCOPE',
          message: `Scope Restriction: You are not an assigned course reviewer for ${doc.courseCode}.`
        }
      });
      return;
    }
  }

  if (decision === 'REJECTED' && (!feedbackReason || feedbackReason.trim().length < 5)) {
    res.status(400).json({
      success: false,
      error: { code: 'REASON_REQUIRED', message: 'A constructive academic reason is required when rejecting a document submission.' }
    });
    return;
  }

  // Apply review decision
  const reviewId = crypto.randomUUID();
  const reviewRecord = {
    id: reviewId,
    documentId: doc.id,
    reviewerId: req.user.id,
    reviewerName: req.user.fullName,
    reviewerRole: req.user.role,
    decision,
    feedbackReason: feedbackReason || 'Approved for curriculum alignment.',
    createdAt: new Date().toISOString()
  };
  db.documentReviews.set(reviewId, reviewRecord);

  const verification = db.documentVerifications.get(doc.id);

  if (decision === 'APPROVED') {
    doc.status = 'APPROVED';
    doc.isVerified = true;
    doc.verifiedAt = new Date().toISOString();
    doc.verifiedBy = req.user.fullName;
    doc.rejectionReason = undefined;

    if (verification) {
      verification.status = 'VERIFIED';
      verification.verifiedBy = req.user.id;
      verification.verifiedByName = req.user.fullName;
      verification.verifiedAt = doc.verifiedAt;
    }
  } else {
    doc.status = 'REJECTED';
    doc.isVerified = false;
    doc.rejectionReason = feedbackReason;

    if (verification) {
      verification.status = 'REJECTED';
    }
  }

  doc.updatedAt = new Date().toISOString();

  db.logAudit(
    { id: req.user.id, name: req.user.fullName, role: req.user.role },
    decision === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
    'DOCUMENT',
    doc.id,
    { title: doc.title, decision, reason: feedbackReason },
    req.ip
  );

  res.json({
    success: true,
    data: {
      document: serializeDocument(doc),
      review: reviewRecord,
      message: decision === 'APPROVED' ? 'Document verified and published to the academic library.' : 'Document rejected with recorded feedback.'
    }
  });
});

// POST /api/v1/documents/:id/report (Content flagging)
router.post('/:id/report', requireAuth, (req: AuthRequest, res: Response): void => {
  const { reasonCategory, details } = req.body;
  const doc = db.documents.get((req.params.id as string));

  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  if (!reasonCategory || !details) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Report reason and explanation details are required.' } });
    return;
  }

  const reportId = crypto.randomUUID();
  const report = {
    id: reportId,
    documentId: doc.id,
    documentTitle: doc.title,
    courseCode: doc.courseCode,
    reporterId: req.user?.id,
    reporterName: req.user?.fullName || 'Anonymous Academic Member',
    reasonCategory,
    details: details.trim(),
    status: 'PENDING' as const,
    createdAt: new Date().toISOString()
  };

  db.contentReports.set(reportId, report);

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'CONTENT_REPORT_SUBMITTED',
    'REPORT',
    reportId,
    { documentId: doc.id, reason: reasonCategory },
    req.ip
  );

  res.status(201).json({
    success: true,
    data: { message: 'Report submitted. Academic moderators have been notified.' }
  });
});

export default router;
