import { Router, type Response } from 'express';
import { pgClient } from '../db/pgClient.ts';
import { requireAuth } from '../auth.ts';
import type { AuthRequest } from '../auth.ts';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  try {
    const result = await pgClient.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch notifications.' } });
  }
});

router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  try {
    const result = await pgClient.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch unread count.' } });
  }
});

router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  try {
    await pgClient.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark notification as read.' } });
  }
});

export default router;
