/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Administration & Moderation Routes (/api/v1/admin)
 * System telemetry, contributor approval, user management, and audit inspection.
 */

import { Router, Response } from 'express';
import { db, CURRENT_RECOMMENDED_ITERATIONS, DbUserRecord } from '../db.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import type { UserRole, UserStatus } from '../../types/index.ts';
import crypto from 'crypto';

const router = Router();

// GET /api/v1/admin/stats
router.get('/stats', requireAuth, requireRole(['ADMINISTRATOR', 'MODERATOR']), (_req: AuthRequest, res: Response): void => {
  const users = Array.from(db.users.values());
  const docs = Array.from(db.documents.values());
  const quizzes = Array.from(db.quizzes.values());
  const attempts = Array.from(db.quizAttempts.values());
  const reports = Array.from(db.contentReports.values());

  const stats = {
    totalUsers: users.length,
    studentsCount: users.filter(u => u.role === 'STUDENT').length,
    lecturersCount: users.filter(u => u.role === 'LECTURER').length,
    moderatorsCount: users.filter(u => u.role === 'MODERATOR').length,
    pendingContributorsCount: users.filter(u => u.status === 'PENDING_APPROVAL').length,
    totalDocuments: docs.length,
    verifiedDocuments: docs.filter(d => d.status === 'APPROVED' && d.isVerified).length,
    pendingDocuments: docs.filter(d => d.status === 'PENDING').length,
    totalQuizzes: quizzes.length,
    totalAttempts: attempts.length,
    pendingReports: reports.filter(r => r.status === 'PENDING').length,
    totalDownloads: docs.reduce((acc, d) => acc + (d.downloadCount || 0), 0)
  };

  res.json({ success: true, data: stats });
});

// GET /api/v1/admin/users
router.get('/users', requireAuth, requireRole(['ADMINISTRATOR']), (_req: AuthRequest, res: Response): void => {
  const list = Array.from(db.users.values()).map(u => db.sanitizeUser(u));
  res.json({ success: true, data: list });
});

// PATCH /api/v1/admin/users/:id/role
router.patch('/users/:id/role', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { role, assignedCourseCodes } = req.body as { role: UserRole; assignedCourseCodes?: string[] };
  const user = db.users.get(((req.params.id as string) as string));

  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const oldRole = user.role;
  user.role = role;
  if (assignedCourseCodes) {
    user.assignedCourseCodes = assignedCourseCodes;
  }

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'USER_ROLE_UPDATED',
    'USER',
    user.id,
    { oldRole, newRole: role, courses: assignedCourseCodes },
    req.ip
  );

  res.json({ success: true, data: db.sanitizeUser(user) });
});

// PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { status } = req.body as { status: UserStatus };
  const user = db.users.get(((req.params.id as string) as string));

  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  user.status = status;

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'USER_STATUS_UPDATED',
    'USER',
    user.id,
    { newStatus: status },
    req.ip
  );

  res.json({ success: true, data: db.sanitizeUser(user) });
});

// POST /api/v1/admin/users (Admin-controlled user provisioning)
router.post('/users', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, fullName, role, departmentId, status } = req.body;

  if (!email || !password || !fullName || !role) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email, password, full name, and role are required.' } });
    return;
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Account already exists.' } });
    return;
  }

  const { hash, salt, iterations, algorithm } = await db.hashPassword(password, undefined, CURRENT_RECOMMENDED_ITERATIONS);
  const dept = departmentId ? db.departments.get(departmentId) : undefined;

  const newUser: DbUserRecord = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    role: role as UserRole,
    status: (status as UserStatus) || 'ACTIVE',
    departmentId: dept?.id,
    departmentName: dept?.name,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
    iterations,
    algorithm
  };

  db.users.set(newUser.id, newUser);

    // FIX 1: ALSO SAVE TO POSTGRESQL
    if (typeof pgClient !== 'undefined' && pgClient.isPostgresEnabled()) {
      await pgClient.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, status, department_id, salt, iterations, algorithm, must_change_password)
        VALUES (db.users.set(newUser.id, newUser);, $2, $3, $4, $5, $6, $7, $8, $9, db.users.set(newUser.id, newUser);0, db.users.set(newUser.id, newUser);1)
        ON CONFLICT (id) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          must_change_password = EXCLUDED.must_change_password
      `, [
        newUser.id,
        newUser.email,
        newUser.passwordHash,
        newUser.fullName,
        newUser.role,
        newUser.status || 'ACTIVE',
        newUser.departmentId || null,
        newUser.salt,
        newUser.iterations,
        newUser.algorithm,
        true // FIX 1: Enforce password change for new users
      ]);
    }

    // ALSO SAVE TO POSTGRESQL SO LOGIN CAN FIND IT
    if (pgClient.isPostgresEnabled()) {
      await pgClient.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, status, department_id, salt, iterations, algorithm, must_change_password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          department_id = EXCLUDED.department_id,
          salt = EXCLUDED.salt,
          iterations = EXCLUDED.iterations,
          algorithm = EXCLUDED.algorithm,
          must_change_password = EXCLUDED.must_change_password
      `, [
        newUser.id,
        newUser.email,
        newUser.passwordHash,
        newUser.fullName,
        newUser.role,
        newUser.status,
        newUser.departmentId || null,
        newUser.salt,
        newUser.iterations,
        newUser.algorithm,
        false
      ]);
    }

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'USER_PROVISIONED',
    'USER',
    newUser.id,
    { email: newUser.email, role: newUser.role, status: newUser.status },
    req.ip
  );

  res.status(201).json({ success: true, data: db.sanitizeUser(newUser) });
});

// GET /api/v1/admin/contributors (Applications: Pending and Processed)
router.get('/contributors', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { filter } = req.query as { filter?: 'PENDING' | 'PROCESSED' | 'ALL' };

  let list = Array.from(db.users.values());

  if (filter === 'PENDING') {
    list = list.filter(u => u.status === 'PENDING_APPROVAL');
  } else if (filter === 'PROCESSED') {
    list = list.filter(u => (u.status === 'ACTIVE' || u.status === 'REJECTED') && u.reviewedBy);
  } else {
    // Default to pending if no filter, or ALL if explicitly requested
    if (!filter) {
      list = list.filter(u => u.status === 'PENDING_APPROVAL');
    }
  }

  const sanitized = list.map(u => db.sanitizeUser(u));
  res.json({ success: true, data: sanitized });
});

// POST /api/v1/admin/contributors/:id/approve
router.post('/contributors/:id/approve', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { approvedRole, assignedCourseCodes } = req.body;
  const user = db.users.get(((req.params.id as string) as string));

  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const finalRole: UserRole = approvedRole || user.requestedRole || user.role || 'LECTURER';
  user.role = finalRole;
  user.status = 'ACTIVE';
  user.reviewedBy = req.user?.id;
  user.reviewedAt = new Date().toISOString();

  if (finalRole === 'LECTURER') {
    user.assignedCourseCodes = assignedCourseCodes || user.assignedCourseCodes || ['CSC 201'];
  }

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'CONTRIBUTOR_APPROVED',
    'USER',
    user.id,
    { role: user.role, courses: user.assignedCourseCodes },
    req.ip
  );

  res.json({
    success: true,
    data: db.sanitizeUser(user),
    message: `${user.fullName} has been approved as an active ${finalRole.toLowerCase()}.`
  });
});

// POST /api/v1/admin/contributors/:id/reject
router.post('/contributors/:id/reject', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { reason } = req.body;
  const user = db.users.get(((req.params.id as string) as string));

  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  user.status = 'REJECTED';
  user.rejectionReason = reason || 'Application did not meet institutional verification criteria.';
  user.reviewedBy = req.user?.id;
  user.reviewedAt = new Date().toISOString();

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'CONTRIBUTOR_APPLICATION_REJECTED',
    'USER',
    user.id,
    { reason: user.rejectionReason },
    req.ip
  );

  res.json({
    success: true,
    data: db.sanitizeUser(user),
    message: `Application for ${user.fullName} has been rejected.`
  });
});

// GET /api/v1/admin/reports
router.get('/reports', requireAuth, requireRole(['MODERATOR', 'ADMINISTRATOR']), (_req: AuthRequest, res: Response): void => {
  const reports = Array.from(db.contentReports.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: reports });
});

// POST /api/v1/admin/reports/:id/resolve
router.post('/reports/:id/resolve', requireAuth, requireRole(['MODERATOR', 'ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { resolution, restrictDocument } = req.body as { resolution: 'RESOLVED' | 'DISMISSED'; restrictDocument?: boolean };
  const report = db.contentReports.get(((req.params.id as string) as string));

  if (!report) {
    res.status(404).json({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
    return;
  }

  report.status = resolution;
  report.resolvedBy = req.user?.id;
  report.resolvedAt = new Date().toISOString();

  if (restrictDocument) {
    const doc = db.documents.get(report.documentId);
    if (doc) {
      doc.status = 'RESTRICTED';
      doc.isVerified = false;
    }
  }

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'CONTENT_REPORT_RESOLVED',
    'REPORT',
    report.id,
    { resolution, documentId: report.documentId, restricted: Boolean(restrictDocument) },
    req.ip
  );

  res.json({ success: true, data: report });
});

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', requireAuth, requireRole(['ADMINISTRATOR']), (_req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: db.auditLogs });
});

export default router;
