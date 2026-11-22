import { Router, type NextFunction, type Response } from 'express';
import crypto from 'node:crypto';
import type { Feedback, FeedbackCategory, FeedbackStatus } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { insertPgAudit } from '../db/pgRecords.ts';

const router = Router();
const categories: FeedbackCategory[] = ['PLATFORM', 'COURSE_CONTENT', 'VERIFICATION', 'BUG', 'FEATURE_REQUEST', 'OTHER'];
const statuses: FeedbackStatus[] = ['NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED'];
const feedbackSelect = `
  SELECT id, user_id AS "userId", user_email AS "userEmail", user_name AS "userName",
         user_role AS "userRole", category, title, description, rating, status, admin_notes AS "adminNotes",
         reviewed_by AS "reviewedBy", reviewed_by_name AS "reviewedByName", reviewed_at AS "reviewedAt",
         created_at AS "createdAt", updated_at AS "updatedAt"
  FROM feedback
`;

function usePostgres(next: NextFunction): boolean {
  if (pgClient.isPostgresEnabled()) return true;
  next();
  return false;
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { category, title, description, rating, userEmail, userName } = req.body;
  if (!category || !title || !description) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Category, title, and description are required.' } });
    return;
  }
  if (!categories.includes(category)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_CATEGORY', message: `Category must be one of: ${categories.join(', ')}` } });
    return;
  }
  const id = crypto.randomUUID();
  const feedback: Feedback = {
    id, userId: req.user?.id, userEmail: req.user?.email || (userEmail ? String(userEmail).trim() : undefined),
    userName: req.user?.fullName || (userName ? String(userName).trim() : 'Anonymous Scholar'),
    userRole: req.user?.role || 'VISITOR', category, title: String(title).trim(), description: String(description).trim(),
    rating: rating ? Math.max(1, Math.min(5, Number(rating))) : undefined, status: 'NEW', createdAt: new Date().toISOString()
  };
  try {
    await pgClient.transaction(async client => {
      await client.query(`INSERT INTO feedback (id, user_id, user_email, user_name, user_role, category, title, description, rating, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, feedback.userId ?? null, feedback.userEmail ?? null, feedback.userName, feedback.userRole, feedback.category,
          feedback.title, feedback.description, feedback.rating ?? null, feedback.status]);
      await insertPgAudit(client, req.user ? req.user : { name: feedback.userName, role: 'VISITOR' },
        'FEEDBACK_SUBMITTED', 'FEEDBACK', id, { category: feedback.category, title: feedback.title }, req.ip);
    });
    res.status(201).json({ success: true, data: feedback, message: 'Thank you for your feedback! Our institutional team will review your submission.' });
  } catch (error) { next(error); }
});

router.get('/', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { status, category, q } = req.query as Record<string, string>;
  const values: unknown[] = [];
  const conditions: string[] = [];
  if (status && status !== 'ALL') { values.push(status); conditions.push(`status = $${values.length}`); }
  if (category && category !== 'ALL') { values.push(category); conditions.push(`category = $${values.length}`); }
  if (q?.trim()) {
    values.push(`%${q.trim()}%`);
    conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length} OR user_name ILIKE $${values.length} OR user_email ILIKE $${values.length})`);
  }
  try {
    const [list, counts] = await Promise.all([
      pgClient.query(`${feedbackSelect} ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY created_at DESC`, values),
      pgClient.query(`SELECT COUNT(*) FILTER (WHERE status = 'NEW')::int AS "newCount",
        COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW')::int AS "underReviewCount",
        COUNT(*) FILTER (WHERE status = 'PLANNED')::int AS "plannedCount",
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS "resolvedCount" FROM feedback`)
    ]);
    res.json({ success: true, data: list.rows, meta: { total: list.rowCount, ...counts.rows[0] } });
  } catch (error) { next(error); }
});

router.get('/my', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  try {
    const result = await pgClient.query(`${feedbackSelect} WHERE user_id = $1 OR lower(user_email) = lower($2) ORDER BY created_at DESC`, [req.user.id, req.user.email]);
    const safe = result.rows.map(({ adminNotes: _adminNotes, ...item }) => item);
    res.json({ success: true, data: safe });
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query(`${feedbackSelect} WHERE id = $1`, [req.params.id]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Feedback entry not found.' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

router.put('/:id/status', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const { status, adminNotes } = req.body as { status?: FeedbackStatus; adminNotes?: string };
  if (status && !statuses.includes(status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Status must be one of: ${statuses.join(', ')}` } });
    return;
  }
  try {
    const item = await pgClient.transaction(async client => {
      const updated = await client.query(`UPDATE feedback SET status = COALESCE($1, status),
        admin_notes = CASE WHEN $2::boolean THEN $3 ELSE admin_notes END,
        reviewed_by = $4, reviewed_by_name = $5, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $6 RETURNING id`,
        [status ?? null, adminNotes !== undefined, adminNotes === undefined ? null : adminNotes.trim(), req.user?.id,
          req.user?.fullName, req.params.id]);
      if (!updated.rowCount) return null;
      const full = await client.query(`${feedbackSelect} WHERE id = $1`, [req.params.id]);
      const record = full.rows[0] as Feedback;
      await insertPgAudit(client, req.user, 'FEEDBACK_STATUS_UPDATED', 'FEEDBACK', record.id,
        { newStatus: record.status, hasNotes: Boolean(record.adminNotes) }, req.ip);
      return record;
    });
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Feedback entry not found.' } });
      return;
    }
    res.json({ success: true, data: item, message: `Feedback status updated to ${item.status}.` });
  } catch (error) { next(error); }
});

export default router;
