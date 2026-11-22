import { Router, type Response } from 'express';
import { pgClient } from '../db/pgClient.ts';
import { requireAuth, requireRole } from '../auth.ts';
import type { AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/v1/academic/colleges - Public endpoint for registration/verification
router.get('/colleges', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pgClient.query('SELECT id, name FROM tu_colleges ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch colleges.' } });
  }
});

// GET /api/v1/academic/departments?collegeId=xxx - Get departments for a college
router.get('/departments', async (req: AuthRequest, res: Response) => {
  const { collegeId } = req.query;
  if (!collegeId) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_COLLEGE', message: 'College ID is required.' } });
  }
  try {
    const result = await pgClient.query(
      'SELECT id, name FROM tu_departments WHERE college_id = $1 ORDER BY name',
      [collegeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch departments.' } });
  }
});

export default router;
