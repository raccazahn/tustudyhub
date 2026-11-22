import { Router, type NextFunction, type Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import type { DocumentStatus } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { insertPgAudit } from '../db/pgRecords.ts';
import { StorageService } from '../storage.ts';
import { StampingService } from '../services/StampingService.ts';

const router = Router();
const incomingDirectory = StorageService.getIncomingDirectory();
mkdirSync(incomingDirectory, { recursive: true, mode: 0o700 });

const upload = multer({
  storage: multer.diskStorage({ destination: incomingDirectory, filename: (_req, _file, callback) => callback(null, crypto.randomUUID()) }),
  limits: { fileSize: 1024 * 1024 * 10 }
});

const documentSelect = `SELECT doc.id, doc.course_id AS "courseId", c.code AS "courseCode", c.title AS "courseTitle", d.name AS "departmentName", doc.uploader_id AS "uploaderId", COALESCE(doc.uploader_name, uploader.full_name, 'Unknown') AS "uploaderName", COALESCE(doc.uploader_role, uploader.role) AS "uploaderRole", doc.title, COALESCE(doc.description, '') AS description, doc.category, doc.academic_year AS "academicYear", doc.file_name AS "fileName", doc.file_size AS "fileSize", doc.mime_type AS "mimeType", doc.file_hash AS "fileHash", doc.status, doc.access_level AS "accessLevel", doc.download_count AS "downloadCount", doc.verification_token AS "verificationToken", doc.is_verified AS "isVerified", doc.verified_at AS "verifiedAt", COALESCE(verifier.full_name, doc.verified_by::text) AS "verifiedBy", doc.rejection_reason AS "rejectionReason", doc.internal_file_path AS "internalFilePath", ver.stamped_internal_file_path AS "stampedInternalFilePath", doc.created_at AS "createdAt", doc.updated_at AS "updatedAt" FROM documents doc JOIN courses c ON c.id = doc.course_id JOIN departments d ON d.id = c.department_id LEFT JOIN users uploader ON uploader.id = doc.uploader_id LEFT JOIN users verifier ON verifier.id = doc.verified_by LEFT JOIN document_verifications ver ON ver.document_id = doc.id`;

function usePostgres(next: NextFunction): boolean { if (pgClient.isPostgresEnabled()) return true; next(); return false; }

function serialize(doc: Record<string, unknown>, includeVerification: boolean = true): Record<string, unknown> {
  const { internalFilePath: _internalFilePath, stampedInternalFilePath: _stampedInternalFilePath, ...publicDocument } = doc;
  const sizedDoc: Record<string, unknown> = { ...publicDocument, fileSize: Number(publicDocument.fileSize), downloadCount: Number(publicDocument.downloadCount) };
  if (!includeVerification) {
    const { verificationToken: _verificationToken, isVerified: _isVerified, verifiedAt: _verifiedAt, verifiedBy: _verifiedBy, fileHash: _fileHash, ...metadata } = sizedDoc;
    return metadata;
  }
  return sizedDoc;
}

function denyInactive(user: AuthRequest['user'], res: Response): boolean {
  if (user?.status === 'PENDING_APPROVAL' || user?.status === 'REJECTED') { res.status(403).json({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' } }); return true; }
  if (user?.status === 'SUSPENDED') { res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' } }); return true; }
  return false;
}

function canAccessUnapproved(user: AuthRequest['user'], doc: { uploaderId: string; courseCode: string }): boolean {
  return Boolean(user && (user.id === doc.uploaderId || ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role)));
}

async function findDocument(id: string) {
  const result = await pgClient.query(`${documentSelect} WHERE doc.id = $1`, [id]);
  return result.rows[0] as any;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (denyInactive(req.user, res)) return;
  const { courseId, category, status, q } = req.query as Record<string, string>;
  try {
    const where: string[] = []; const values: unknown[] = [];
    const add = (value: unknown, condition: (parameter: string) => string) => { values.push(value); where.push(condition(`$${values.length}`)); };
    const user = req.user;
    if (!user) where.push("doc.status = 'APPROVED' AND doc.access_level = 'PUBLIC'");
    else if (user.role === 'STUDENT') add(user.id, p => `(doc.status = 'APPROVED' OR doc.uploader_id = ${p})`);
    else if (user.role === 'LECTURER') { const assignedCourses = user.assignedCourseCodes || []; values.push(user.id, assignedCourses); where.push(`(doc.status = 'APPROVED' OR doc.uploader_id = $${values.length - 1} OR c.code = ANY($${values.length}::varchar[]))`); }
    if (courseId) add(courseId, p => `doc.course_id = ${p}`);
    if (category) add(category.toUpperCase(), p => `doc.category = ${p}`);
    if (status && (user?.role === 'ADMINISTRATOR' || user?.role === 'MODERATOR' || user?.role === 'LECTURER')) add(status.toUpperCase(), p => `doc.status = ${p}`);
    if (q) { const term = `%${q.toLowerCase()}%`; add(term, p => `(doc.title ILIKE ${p} OR COALESCE(doc.description, '') ILIKE ${p} OR c.code ILIKE ${p} OR doc.verification_token ILIKE ${p})`); }
    const queryStr = `${documentSelect} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY doc.created_at DESC`;
    const result = await pgClient.query(queryStr, values);
    res.json({ success: true, data: result.rows.map(row => serialize(row, Boolean(req.user))), meta: { total: result.rows.length } });
  } catch (error) { console.error('🔥 Document fetch error:', error); next(error); }
});

router.post('/', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }); return; }
  const user = req.user; // <-- TypeScript fix: capture user locally

  const multerError = (req as any).multerError;
  if (multerError && multerError.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Document file size exceeds the strict 10MB institutional limit.' } });
  if (!req.file) return res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'Academic document file is required.' } });
  const { courseId, title, description, category, academicYear, accessLevel } = req.body;
  if (!courseId || !title || !category) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Course, title, and document category are required.' } });
  try {
    const course = await pgClient.query<{ id: string; code: string; title: string; departmentName: string }>('SELECT c.id, c.code, c.title, d.name AS "departmentName" FROM courses c JOIN departments d ON d.id = c.department_id WHERE c.id = $1', [courseId]);
    if (!course.rowCount) return res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Selected course does not exist.' } });
    const stored = await StorageService.saveDocumentFromTemp(req.file.originalname, req.file.path);
    const docId = crypto.randomUUID();
    const token = `TSH-${course.rows[0].code.replace(/\s+/g, '')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const initialStatus: DocumentStatus = (user.role === 'ADMINISTRATOR' || user.role === 'MODERATOR') ? 'APPROVED' : 'PENDING';
    await pgClient.transaction(async client => {
      await client.query(`INSERT INTO documents (id, course_id, uploader_id, uploader_name, uploader_role, title, description, category, academic_year, file_name, file_size, mime_type, file_hash, internal_file_path, status, access_level, verification_token, is_verified, verified_at, verified_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [docId, course.rows[0].id, user.id, user.fullName, user.role, title.trim(), description ? description.trim() : '', category, academicYear || '2025/2026', stored.fileName, stored.fileSize, stored.mimeType, stored.fileHash, stored.internalFileName, initialStatus, accessLevel || 'PUBLIC', token, initialStatus === 'APPROVED', initialStatus === 'APPROVED' ? new Date().toISOString() : null, initialStatus === 'APPROVED' ? user.id : null]);
      await client.query('INSERT INTO document_verifications (id, document_id, verification_token, status, verified_by, verified_by_name, verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [crypto.randomUUID(), docId, token, initialStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING', initialStatus === 'APPROVED' ? user.id : null, initialStatus === 'APPROVED' ? user.fullName : null, initialStatus === 'APPROVED' ? new Date().toISOString() : null]);
      await insertPgAudit(client, user, 'DOCUMENT_SUBMITTED', 'DOCUMENT', docId, { title: title.trim(), course: course.rows[0].code, category, hash: stored.fileHash }, req.ip);
    });
    res.status(201).json({ success: true, data: serialize(await findDocument(docId)), message: 'Academic document submitted successfully.' });
  } catch (error: any) { if (error?.code === '22P02') return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Document category or access level is invalid.' } }); next(error); }
});

router.post('/batch', requireAuth, upload.array('files', 15), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }); return; }
  const user = req.user; // <-- TypeScript fix: capture user locally

  const files = (req.files as Express.Multer.File[]) || [];
  const { courseId, category, academicYear, accessLevel, status, titles, categories, descriptions } = req.body;
  if (files.length === 0) return res.status(400).json({ success: false, error: { code: 'MISSING_FILES', message: 'At least one academic document file is required.' } });
  if (!courseId) return res.status(400).json({ success: false, error: { code: 'MISSING_COURSE', message: 'Target course ID is required.' } });
  try {
    const courseResult = await pgClient.query<{ id: string; code: string; title: string; departmentName: string }>('SELECT c.id, c.code, c.title, d.name AS "departmentName" FROM courses c JOIN departments d ON d.id = c.department_id WHERE c.id = $1', [courseId]);
    if (!courseResult.rowCount) return res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Target course does not exist.' } });
    const course = courseResult.rows[0];
    const parseArray = (value: unknown): string[] => { if (Array.isArray(value)) return value as string[]; if (typeof value !== 'string') return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } };
    const fileTitles = parseArray(titles); const fileCategories = parseArray(categories); const fileDescriptions = parseArray(descriptions);
    const isPrivileged = user.role === 'ADMINISTRATOR' || (user.role === 'LECTURER' && (user.assignedCourseCodes || []).includes(course.code));
    const targetStatus: DocumentStatus = (status === 'APPROVED' && isPrivileged) ? 'APPROVED' : 'PENDING';
    const createdDocs: any[] = []; const errors: Array<{ file: string; reason: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const fileTitle = fileTitles[i] || file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const fileCategory = (fileCategories[i] || category || 'LECTURE_NOTE') as any; const fileDesc = fileDescriptions[i] || '';
      const duplicate = await pgClient.query('SELECT 1 FROM documents WHERE course_id = $1 AND lower(file_name) = lower($2)', [course.id, file.originalname]);
      if (duplicate.rowCount) { errors.push({ file: file.originalname, reason: `Duplicate document '${file.originalname}' already exists for ${course.code}.` }); continue; }
      try {
        const stored = await StorageService.saveDocumentFromTemp(file.originalname, file.path);
        const docId = crypto.randomUUID(); const token = `TSH-${course.code.replace(/\s+/g, '')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        await pgClient.transaction(async client => {
          await client.query(`INSERT INTO documents (id, course_id, uploader_id, uploader_name, uploader_role, title, description, category, academic_year, file_name, file_size, mime_type, file_hash, internal_file_path, status, access_level, verification_token, is_verified, verified_at, verified_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [docId, course.id, user.id, user.fullName, user.role, fileTitle.trim(), fileDesc.trim(), fileCategory, academicYear || '2025/2026', stored.fileName, stored.fileSize, stored.mimeType, stored.fileHash, stored.internalFileName, targetStatus, accessLevel || 'PUBLIC', token, targetStatus === 'APPROVED', targetStatus === 'APPROVED' ? new Date().toISOString() : null, targetStatus === 'APPROVED' ? user.id : null]);
          await client.query('INSERT INTO document_verifications (id, document_id, verification_token, status, verified_by, verified_by_name, verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [crypto.randomUUID(), docId, token, targetStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING', targetStatus === 'APPROVED' ? user.id : null, targetStatus === 'APPROVED' ? user.fullName : null, targetStatus === 'APPROVED' ? new Date().toISOString() : null]);
        });
        const saved = await findDocument(docId); if (saved) createdDocs.push(serialize(saved));
      } catch (error: any) { errors.push({ file: file.originalname, reason: error.message || 'Invalid format or file signature.' }); }
    }
    await pgClient.transaction(async client => { await insertPgAudit(client, user, 'DOCUMENTS_BATCH_SUBMITTED', 'COURSE', course.id, { courseCode: course.code, totalFiles: files.length, successCount: createdDocs.length, errorCount: errors.length, status: targetStatus }, req.ip); });
    res.status(createdDocs.length > 0 ? 201 : 400).json({ success: createdDocs.length > 0, data: { created: createdDocs, count: createdDocs.length, errors: errors.length > 0 ? errors : undefined, message: `${createdDocs.length} material(s) uploaded successfully for ${course.code}.${errors.length > 0 ? ` ${errors.length} file(s) skipped.` : ''}` } });
  } catch (error: any) { console.error('\n❌❌❌ BATCH UPLOAD FAILED ❌❌❌'); next(error); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const doc = await findDocument((req.params.id as string));
    if (!doc) return res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    if (!req.user && doc.accessLevel === 'STUDENT_ONLY') return res.status(401).json({ success: false, error: { code: 'ACCOUNT_REQUIRED', message: 'Please sign in.' } });
    if (denyInactive(req.user, res)) return;
    if (doc.status !== 'APPROVED' && !canAccessUnapproved(req.user, doc)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Document is pending academic review.' } });
    const user = req.user; // <-- TypeScript fix: capture user locally
    const [verification, reviews] = user ? await Promise.all([pgClient.query('SELECT id, document_id AS "documentId", verification_token AS "verificationToken", status, verified_by AS "verifiedBy", verified_by_name AS "verifiedByName", verified_at AS "verifiedAt", revocation_reason AS "revocationReason", revoked_by AS "revokedBy", revoked_by_name AS "revokedByName", revoked_at AS "revokedAt", created_at AS "createdAt", stamped_internal_file_path AS "stampedInternalFilePath" FROM document_verifications WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1', [doc.id]), pgClient.query('SELECT id, document_id AS "documentId", reviewer_id AS "reviewerId", reviewer_name AS "reviewerName", reviewer_role AS "reviewerRole", decision, feedback_reason AS "feedbackReason", created_at AS "createdAt" FROM document_reviews WHERE document_id = $1 ORDER BY created_at DESC', [doc.id])]) : [null, null];
    res.json({ success: true, data: { ...serialize(doc, Boolean(user)), ...(user ? { verification: verification?.rows[0], reviews: reviews?.rows } : {}) } });
  } catch (error) { next(error); }
});

async function streamDocument(req: AuthRequest, res: Response, next: NextFunction, disposition: 'inline' | 'attachment'): Promise<void> {
  if (!usePostgres(next)) return;
  try {
    if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }); return; }
    const user = req.user; // <-- TypeScript fix: capture user locally
    const doc = await findDocument((req.params.id as string));
    if (!doc) { res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } }); return; }
    if (denyInactive(user, res)) return;
    if (doc.status !== 'APPROVED' && !canAccessUnapproved(user, doc)) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Document is pending academic review.' } }); return; }
    const filePathToServe = doc.stampedInternalFilePath ? `stamped/${doc.stampedInternalFilePath}` : doc.internalFilePath;
    const { buffer, mimeType } = await StorageService.getDocumentBuffer(filePathToServe, doc.title, doc.courseCode, doc.verificationToken);
    if (disposition === 'attachment') await pgClient.query('UPDATE documents SET download_count = download_count + 1 WHERE id = $1', [doc.id]);
	   await pgClient.query('INSERT INTO document_views (document_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [doc.id, req.user.id]);
    await pgClient.transaction(client => insertPgAudit(client, user, disposition === 'inline' ? 'DOCUMENT_VIEWED' : 'DOCUMENT_DOWNLOADED', 'DOCUMENT', doc.id, { title: doc.title, token: doc.verificationToken }, req.ip));
    const asciiFilename = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', mimeType); res.setHeader('Content-Disposition', `${disposition}; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
    res.setHeader('Content-Length', buffer.length); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-TuStudyHub-Verified-Token', doc.verificationToken);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, X-TuStudyHub-Verified-Token');
    if (disposition === 'inline') res.setHeader('Cache-Control', doc.accessLevel === 'STUDENT_ONLY' ? 'private, no-cache, no-store, must-revalidate' : 'public, max-age=3600');
    res.send(buffer);
  } catch (error) { console.error('🔥 Stream document error:', error); res.status(500).json({ success: false, error: { code: 'FILE_STREAM_ERROR', message: 'Error streaming protected file.' } }); }
}

router.get('/:id/view', async (req: AuthRequest, res: Response, next: NextFunction) => { void streamDocument(req, res, next, 'inline'); });
router.get('/:id/download', async (req: AuthRequest, res: Response, next: NextFunction) => { void streamDocument(req, res, next, 'attachment'); });

router.post('/:id/review', requireAuth, requireRole(['LECTURER', 'MODERATOR', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }); return; }
  const user = req.user; // <-- TypeScript fix: capture user locally
  const { decision, feedbackReason } = req.body as { decision: 'APPROVED' | 'REJECTED'; feedbackReason: string };
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ success: false, error: { code: 'INVALID_DECISION', message: 'Decision must be APPROVED or REJECTED.' } });
  if (decision === 'REJECTED' && (!feedbackReason || feedbackReason.trim().length < 5)) return res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: 'A constructive academic reason is required when rejecting a document submission.' } });
  try {
    const result = await pgClient.transaction(async client => {
      const docCheck = await client.query('SELECT id, course_id, uploader_id, title, verification_token, internal_file_path, status FROM documents WHERE id = $1', [(req.params.id as string)]);
      if (!docCheck.rowCount) return { missing: true as const };
      const doc = docCheck.rows[0];
      if (doc.uploader_id === user.id && user.role !== 'ADMINISTRATOR') return { selfReview: true as const };
      const now = new Date(); const isApproved = decision === 'APPROVED';
      await client.query(`UPDATE documents SET status = $1, is_verified = $2, verified_at = $3, verified_by = $4, rejection_reason = $5, updated_at = NOW() WHERE id = $6`, [decision, isApproved, isApproved ? now : null, isApproved ? user.id : null, decision === 'REJECTED' ? feedbackReason : null, doc.id]);
      await client.query(`INSERT INTO document_reviews (id, document_id, reviewer_id, reviewer_name, reviewer_role, decision, feedback_reason) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [crypto.randomUUID(), doc.id, user.id, user.fullName, user.role, decision, feedbackReason || 'Approved by Administrator.']);
      await client.query(`UPDATE document_verifications SET status = $1, verified_by = $2, verified_by_name = $3, verified_at = $4 WHERE document_id = $5`, [isApproved ? 'VERIFIED' : 'REJECTED', isApproved ? user.id : null, isApproved ? user.fullName : null, isApproved ? now : null, doc.id]);
      if (isApproved && doc.internal_file_path) {
        try {
          const fullOriginalPath = path.join(process.cwd(), 'uploads', 'documents', doc.internal_file_path);
          const stampResult = await StampingService.stampDocument(fullOriginalPath, doc.title, doc.verification_token, now.toISOString());
          if (stampResult.success) await client.query(`UPDATE document_verifications SET stamped_internal_file_path = $1, stamped_file_hash = $2 WHERE document_id = $3`, [stampResult.stampedInternalFilePath, stampResult.stampedFileHash, doc.id]);
        } catch (stampErr) { console.warn('⚠️ Stamping failed, but approval will continue:', stampErr); }
      }
      const notifType = isApproved ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED';
      const notifTitle = isApproved ? 'Document Approved' : 'Document Rejected';
      const notifMessage = isApproved ? `Your document "${doc.title}" has been approved and is now visible to students.` : `Your document "${doc.title}" was rejected. Reason: ${feedbackReason}`;
      await client.query(`INSERT INTO notifications (id, user_id, type, title, message, entity_id, entity_type, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'DOCUMENT', NOW())`, [crypto.randomUUID(), doc.uploader_id, notifType, notifTitle, notifMessage, doc.id]);
      await insertPgAudit(client, user, isApproved ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED', 'DOCUMENT', doc.id, { title: doc.title, decision, reason: feedbackReason }, req.ip);
      return { success: true, docId: doc.id };
    });
    if ('missing' in result) return res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    if ('selfReview' in result) return res.status(403).json({ success: false, error: { code: 'SELF_APPROVAL_PROHIBITED', message: 'You cannot approve your own submission.' } });
    const updatedDocResult = await pgClient.query(`${documentSelect} WHERE doc.id = $1`, [result.docId]);
    res.json({ success: true, data: updatedDocResult.rows[0], message: `Document successfully ${decision === 'APPROVED' ? 'approved' : 'rejected'}.` });
  } catch (error: any) { console.error('❌ Review route error:', error); next(error); }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }); return; }
  const user = req.user; // <-- TypeScript fix: capture user locally
  try {
    const doc = await findDocument((req.params.id as string));
    if (!doc) return res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    const isAdmin = user.role === 'ADMINISTRATOR';
    const isOwner = doc.uploaderId === user.id && doc.status === 'PENDING';
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only administrators or the author of a pending submission can delete this material.' } });
    await pgClient.transaction(async client => {
      await client.query('DELETE FROM documents WHERE id = $1', [doc.id]);
      await insertPgAudit(client, user, 'DOCUMENT_DELETED', 'DOCUMENT', doc.id, { title: doc.title, courseCode: doc.courseCode, fileName: doc.fileName }, req.ip);
    });
    res.json({ success: true, message: `Academic document '${doc.title}' deleted successfully.` });
  } catch (error) { next(error); }
});

export default router;
