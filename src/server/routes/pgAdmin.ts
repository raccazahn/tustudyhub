import { validatePassword } from '../../lib/passwordValidator.ts';
import { Router, type NextFunction, type Response } from 'express';
import crypto from 'node:crypto';
import type { UserRole, UserStatus } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { CURRENT_RECOMMENDED_ITERATIONS, db } from '../db.ts';
import { pgClient } from '../db/pgClient.ts';
import { findPgUserByEmail, findPgUserById, insertPgAudit, recordPgAudit, mapPgUser, PG_USER_SELECT, type PgUserRow } from '../db/pgRecords.ts';

const router = Router();
const validRoles: UserRole[] = ['VISITOR', 'STUDENT', 'LECTURER', 'MODERATOR', 'ADMINISTRATOR'];
const validStatuses: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'REJECTED'];

function usePostgres(next: NextFunction): boolean {
  if (pgClient.isPostgresEnabled()) return true;
  next();
  return false;
}

router.get('/stats', requireAuth, requireRole(['ADMINISTRATOR', 'MODERATOR']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS "totalUsers",
        (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT') AS "studentsCount",
        (SELECT COUNT(*)::int FROM users WHERE role = 'LECTURER') AS "lecturersCount",
        (SELECT COUNT(*)::int FROM users WHERE role = 'MODERATOR') AS "moderatorsCount",
        (SELECT COUNT(*)::int FROM users WHERE status = 'PENDING_APPROVAL') AS "pendingContributorsCount",
        (SELECT COUNT(*)::int FROM documents) AS "totalDocuments",
        (SELECT COUNT(*)::int FROM documents WHERE status = 'APPROVED' AND is_verified) AS "verifiedDocuments",
        (SELECT COUNT(*)::int FROM documents WHERE status = 'PENDING') AS "pendingDocuments",
        (SELECT COUNT(*)::int FROM quizzes) AS "totalQuizzes",
        (SELECT COUNT(*)::int FROM quiz_attempts) AS "totalAttempts",
        (SELECT COUNT(*)::int FROM content_reports WHERE status = 'PENDING') AS "pendingReports",
        (SELECT COALESCE(SUM(download_count), 0)::int FROM documents) AS "totalDownloads"
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

router.get('/users', requireAuth, requireRole(['ADMINISTRATOR']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query<PgUserRow>(`${PG_USER_SELECT} ORDER BY u.created_at DESC`);
    res.json({ success: true, data: result.rows.map(row => db.sanitizeUser(mapPgUser(row))) });
  } catch (error) { next(error); }
});

router.patch('/users/:id/role', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { role, assignedCourseCodes } = req.body as { role: UserRole; assignedCourseCodes?: string[] };
  if (!validRoles.includes(role)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'A valid account role is required.' } });
    return;
  }
  try {
    const user = await pgClient.transaction(async client => {
      const current = await client.query<{ role: UserRole }>('SELECT role FROM users WHERE id = $1 FOR UPDATE', [(req.params.id as string)]);
      if (!current.rowCount) return null;
      await client.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, (req.params.id as string)]);
      if (assignedCourseCodes !== undefined) {
        await client.query('DELETE FROM lecturer_course_assignments WHERE lecturer_id = $1', [(req.params.id as string)]);
        if (role === 'LECTURER' && Array.isArray(assignedCourseCodes) && assignedCourseCodes.length) {
          await client.query(`INSERT INTO lecturer_course_assignments (lecturer_id, course_id)
            SELECT $1, c.id FROM courses c WHERE c.code = ANY($2::varchar[])
            ON CONFLICT (lecturer_id, course_id) DO NOTHING`, [(req.params.id as string), assignedCourseCodes]);
        }
      }
      await insertPgAudit(client, req.user, 'USER_ROLE_UPDATED', 'USER', (req.params.id as string),
        { oldRole: current.rows[0].role, newRole: role, courses: assignedCourseCodes }, req.ip);
      const updated = await client.query<PgUserRow>(`${PG_USER_SELECT} WHERE u.id = $1`, [(req.params.id as string)]);
      return updated.rows[0] ? mapPgUser(updated.rows[0]) : null;
    });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }
    res.json({ success: true, data: db.sanitizeUser(user) });
  } catch (error) { next(error); }
});

router.patch('/users/:id/status', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { status } = req.body as { status: UserStatus };
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'A valid account status is required.' } });
    return;
  }
  try {
    const result = await pgClient.transaction(async client => {
      const updated = await client.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id', [status, (req.params.id as string)]);
      if (!updated.rowCount) return false;
      await insertPgAudit(client, req.user, 'USER_STATUS_UPDATED', 'USER', (req.params.id as string), { newStatus: status }, req.ip);
      return true;
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }
    const user = await findPgUserById((req.params.id as string));
    res.json({ success: true, data: user ? db.sanitizeUser(user) : null });
  } catch (error) { next(error); }
});

router.post('/users', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!usePostgres(next)) return;
    const { email, password, fullName, role, departmentId, status } = req.body;

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: passwordValidation.errors.join(', ') } });
      return;
    }
    if (!passwordValidation.valid) {
      res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: passwordValidation.errors.join(', ') } });
      return;
    }
  if (!email || !password || !fullName || !role) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email, password, full name, and role are required.' } });
    return;
  }
  if (!validRoles.includes(role) || (status && !validStatuses.includes(status))) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'A valid account role and status are required.' } });
    return;
  }
  const id = crypto.randomUUID();
  try {
    if (await findPgUserByEmail(email)) {
      res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Account already exists.' } });
      return;
    }
    const hash = await db.hashPassword(password, undefined, CURRENT_RECOMMENDED_ITERATIONS);
    const created = await pgClient.transaction(async client => {
      const inserted = await client.query('INSERT INTO users (id, email, password_hash, salt, iterations, algorithm, full_name, role, status, requested_role, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $8, $10) RETURNING id',
        [id, String(email).trim().toLowerCase(), hash.hash, hash.salt, hash.iterations, hash.algorithm,
          String(fullName).trim(), role, status || 'ACTIVE', departmentId || null]);
      await insertPgAudit(client, req.user, 'USER_PROVISIONED', 'USER', id,
        { email: String(email).trim().toLowerCase(), role, status: status || 'ACTIVE' }, req.ip);
      return Boolean(inserted.rowCount);
    });
    if (!created) throw new Error('User insert did not return a record.');
    const user = await findPgUserById(id);
    res.status(201).json({ success: true, data: user ? db.sanitizeUser(user) : null });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Account already exists.' } });
      return;
    }
    next(error);
  }
});

router.get('/contributors', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { filter } = req.query as { filter?: 'PENDING' | 'PROCESSED' | 'ALL' };
  try {
    const conditions = filter === 'PENDING' ? "WHERE u.status = 'PENDING_APPROVAL'"
      : filter === 'PROCESSED' ? "WHERE u.status IN ('ACTIVE', 'REJECTED') AND u.reviewed_by IS NOT NULL"
      : filter ? '' : "WHERE u.status = 'PENDING_APPROVAL'";
    const result = await pgClient.query<PgUserRow>(`${PG_USER_SELECT} ${conditions} ORDER BY u.created_at DESC`);
    res.json({ success: true, data: result.rows.map(row => db.sanitizeUser(mapPgUser(row))) });
  } catch (error) { next(error); }
});

router.post('/contributors/:id/approve', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { approvedRole, assignedCourseCodes } = req.body as { approvedRole?: UserRole; assignedCourseCodes?: string[] };
  if (approvedRole && !validRoles.includes(approvedRole)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'A valid account role is required.' } });
    return;
  }
  try {
    const user = await pgClient.transaction(async client => {
      const current = await client.query<{ role: UserRole; requestedRole: UserRole | null; fullName: string }>(
        'SELECT role, requested_role AS "requestedRole", full_name AS "fullName" FROM users WHERE id = $1 FOR UPDATE', [(req.params.id as string)]);
      if (!current.rowCount) return null;
      const role = approvedRole || current.rows[0].requestedRole || current.rows[0].role || 'LECTURER';
      await client.query('UPDATE users SET role = $1, status = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW() WHERE id = $4',
        [role, 'ACTIVE', req.user?.id, (req.params.id as string)]);

      // Trigger notification for approval
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type)
        VALUES ($1, 'CONTRIBUTOR_APPROVED', 'Application Approved', 'Your contributor application has been approved. You now have ${role} privileges.', $2, 'USER')
      `, [(req.params.id as string), (req.params.id as string)]);
      if (role === 'LECTURER' && Array.isArray(assignedCourseCodes)) {
        await client.query('DELETE FROM lecturer_course_assignments WHERE lecturer_id = $1', [(req.params.id as string)]);
        if (assignedCourseCodes.length) await client.query(`INSERT INTO lecturer_course_assignments (lecturer_id, course_id)
          SELECT $1, c.id FROM courses c WHERE c.code = ANY($2::varchar[]) ON CONFLICT DO NOTHING`, [(req.params.id as string), assignedCourseCodes]);
      }
      await insertPgAudit(client, req.user, 'CONTRIBUTOR_APPROVED', 'USER', (req.params.id as string),
        { role, courses: assignedCourseCodes }, req.ip);
      return { role, fullName: current.rows[0].fullName };
    });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }
    const record = await findPgUserById((req.params.id as string));
    res.json({ success: true, data: record ? db.sanitizeUser(record) : null, message: `${user.fullName} has been approved as an active ${user.role.toLowerCase()}.` });
  } catch (error) { next(error); }
});

router.post('/contributors/:id/reject', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const reason = typeof req.body.reason === 'string' && req.body.reason.trim()
    ? req.body.reason.trim() : 'Application did not meet institutional verification criteria.';
  try {
    const result = await pgClient.transaction(async client => {
      const updated = await client.query('UPDATE users SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW() WHERE id = $4 RETURNING id',
        ['REJECTED', reason, req.user?.id, (req.params.id as string)]);
      if (!updated.rowCount) return false;

      // Trigger notification for rejection
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type)
        VALUES ($1, 'CONTRIBUTOR_REJECTED', 'Application Rejected', 'Your contributor application was rejected. Reason: ${reason}', $2, 'USER')
      `, [(req.params.id as string), (req.params.id as string)]);

      await insertPgAudit(client, req.user, 'CONTRIBUTOR_APPLICATION_REJECTED', 'USER', (req.params.id as string), { reason }, req.ip);
      return true;
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }
    const user = await findPgUserById((req.params.id as string));
    res.json({ success: true, data: user ? db.sanitizeUser(user) : null, message: `Application for ${user?.fullName ?? 'user'} has been rejected.` });
  } catch (error) { next(error); }
});

router.get('/reports', requireAuth, requireRole(['MODERATOR', 'ADMINISTRATOR']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query(`SELECT id, document_id AS "documentId", document_title AS "documentTitle", course_code AS "courseCode", reporter_id AS "reporterId", reporter_name AS "reporterName", reason_category AS "reasonCategory", details, status, resolved_by AS "resolvedBy", resolved_at AS "resolvedAt", created_at AS "createdAt" FROM content_reports ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post('/reports/:id/resolve', requireAuth, requireRole(['MODERATOR', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { resolution, restrictDocument } = req.body as { resolution: 'RESOLVED' | 'DISMISSED'; restrictDocument?: boolean };
  if (!['RESOLVED', 'DISMISSED'].includes(resolution)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Resolution must be RESOLVED or DISMISSED.' } });
    return;
  }
  try {
    const report = await pgClient.transaction(async client => {
      const updated = await client.query<{ id: string; documentId: string }>(
        'UPDATE content_reports SET status = $1, resolved_by = $2, resolved_at = NOW() WHERE id = $3 RETURNING id, document_id AS "documentId"',
        [resolution, req.user?.id, (req.params.id as string)]);
      if (!updated.rowCount) return null;
      if (restrictDocument) await client.query("UPDATE documents SET status = 'RESTRICTED', is_verified = FALSE, updated_at = NOW() WHERE id = $1", [updated.rows[0].documentId]);
      await insertPgAudit(client, req.user, 'CONTENT_REPORT_RESOLVED', 'REPORT', (req.params.id as string),
        { resolution, documentId: updated.rows[0].documentId, restricted: Boolean(restrictDocument) }, req.ip);
      const full = await client.query('SELECT id, document_id AS "documentId", document_title AS "documentTitle", course_code AS "courseCode", reporter_id AS "reporterId", reporter_name AS "reporterName", reason_category AS "reasonCategory", details, status, resolved_by AS "resolvedBy", resolved_at AS "resolvedAt", created_at AS "createdAt" FROM content_reports WHERE id = $1', [(req.params.id as string)]);
      return full.rows[0];
    });
    if (!report) {
      res.status(404).json({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
      return;
    }
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
});

router.get('/audit-logs', requireAuth, requireRole(['ADMINISTRATOR']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query('SELECT id, actor_id AS "actorId", actor_name AS "actorName", actor_role AS "actorRole", action, target_type AS "targetType", target_id AS "targetId", metadata, ip_address AS "ipAddress", created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 1000');
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});


// POST /api/v1/admin/users/:id/reset-password
router.post('/users/:id/reset-password', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { newPassword } = req.body as { newPassword?: string };

  if (!newPassword) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'New password is required.' } });
    return;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: passwordValidation.errors.join(', ') } });
    return;
  }

  try {
    const hash = await db.hashPassword(newPassword, undefined, CURRENT_RECOMMENDED_ITERATIONS);
    await pgClient.query(
      'UPDATE users SET password_hash = export default router;, salt = $2, iterations = $3, algorithm = $4, must_change_password = TRUE, updated_at = NOW() WHERE id = $5',
      [hash.hash, hash.salt, hash.iterations, hash.algorithm, (req.params.id as string)]
    );
    await recordPgAudit(req.user, 'ADMIN_PASSWORD_RESET', 'USER', (req.params.id as string), {}, req.ip);
    res.json({ success: true, message: 'User password reset successfully. User will be forced to change it on next login.' });
  } catch (error) {
    next(error);
  }
});

export default router;
