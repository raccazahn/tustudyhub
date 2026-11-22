import { Router, type Response, type NextFunction } from 'express';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { recordPgAudit } from '../db/pgRecords.ts';
import type { Notification, NotificationResponse } from '../../types/index.ts';

const router = Router();

// GET /api/v1/notifications (Fetch user's notifications + unread count)
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return;
  try {
    const result = await pgClient.query(`
      SELECT
        n.id, n.user_id AS "userId", n.type, n.title, n.message,
        n.entity_id AS "entityId", n.entity_type AS "entityType", n.created_at AS "createdAt",
        CASE WHEN nr.notification_id IS NOT NULL THEN true ELSE false END AS "isRead",
        nr.read_at AS "readAt"
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $1
      WHERE n.user_id = $1 OR n.user_id IS NULL
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const unreadCountResult = await pgClient.query(`
      SELECT COUNT(*) as count
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $1
      WHERE (n.user_id = $1 OR n.user_id IS NULL)
        ${req.query.unread === 'true' ? 'AND nr.notification_id IS NULL' : ''} AND nr.notification_id IS NULL
    `, [req.user.id]);

    const notifications: Notification[] = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId || undefined,
      type: row.type,
      title: row.title,
      message: row.message,
      entityId: row.entityId || undefined,
      entityType: row.entityType || undefined,
      isRead: row.isRead,
      readAt: row.readAt ? new Date(row.readAt).toISOString() : undefined,
      createdAt: new Date(row.createdAt).toISOString()
    }));

    const response: NotificationResponse = {
      notifications,
      unreadCount: parseInt(unreadCountResult.rows[0].count, 10)
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return;
  const { id } = req.params;
  try {
    const check = await pgClient.query('SELECT user_id FROM notifications WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found.' } });
    }
    if (check.rows[0].user_id !== req.user.id && check.rows[0].user_id !== null) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    await pgClient.query(`
      INSERT INTO notification_reads (notification_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (notification_id, user_id) DO UPDATE SET read_at = NOW()
    `, [id, req.user.id]);

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return;
  try {
    await pgClient.query(`
      INSERT INTO notification_reads (notification_id, user_id, read_at)
      SELECT n.id, $1, NOW()
      FROM notifications n
      WHERE (n.user_id = $1 OR n.user_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM notification_reads nr
        WHERE nr.notification_id = n.id AND nr.user_id = $1
      )
    `, [req.user.id]);

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notifications/announce (Administrator only)
router.post('/announce', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return;
  const { type, title, message, entityId, entityType } = req.body;
  if (!type || !title || !message) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'type, title, and message are required.' } });
  }
  try {
    const result = await pgClient.query(`
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type)
      VALUES (NULL, $1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [type, title, message, entityId || null, entityType || null]);

    await recordPgAudit(
      { id: req.user.id, name: req.user.fullName, role: req.user.role },
      'ANNOUNCEMENT_CREATED',
      'NOTIFICATION',
      result.rows[0].id,
      { title, type }
    );

    res.status(201).json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    next(error);
  }
});

export default router;
