import { Router, type Request, type Response } from 'express';
import { pgClient } from '../db/pgClient.ts';
import { requireAuth } from '../auth.ts';
import type { AuthRequest } from '../auth.ts';
import crypto from 'node:crypto';

const router = Router();

router.get('/questions', async (req: Request, res: Response) => {
  const { courseId } = req.query;
  try {
    let query = 'SELECT q.*, u.full_name as "authorName", u.role as "authorRole" FROM forum_questions q JOIN users u ON q.user_id = u.id WHERE q.status = $1';
    const params: any[] = ['APPROVED'];
    if (courseId) { params.push(courseId); query += ` AND q.course_id = $${params.length}`; }
    query += ' ORDER BY q.created_at DESC';
    const result = await pgClient.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch questions.' } });
  }
});

router.post('/questions', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  const { courseId, title, body } = req.body;
  if (!courseId || !title || !body) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Course, title, and body are required.' } });
  try {
    const questionId = crypto.randomUUID();
    await pgClient.query('INSERT INTO forum_questions (id, course_id, user_id, title, body, status) VALUES ($1, $2, $3, $4, $5, $6)', [questionId, courseId, req.user.id, title, body, 'PENDING']);
    res.status(201).json({ success: true, data: { id: questionId }, message: 'Question submitted for review.' });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create question.' } });
  }
});

router.get('/questions/:id', async (req: Request, res: Response) => {
  try {
    const questionResult = await pgClient.query('SELECT q.*, u.full_name as "authorName", u.role as "authorRole" FROM forum_questions q JOIN users u ON q.user_id = u.id WHERE q.id = $1', [req.params.id]);
    if (questionResult.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Question not found.' } });
    const answersResult = await pgClient.query('SELECT a.*, u.full_name as "authorName", u.role as "authorRole" FROM forum_answers a JOIN users u ON a.user_id = u.id WHERE a.question_id = $1 ORDER BY a.is_accepted DESC, a.created_at ASC', [req.params.id]);
    res.json({ success: true, data: { question: questionResult.rows[0], answers: answersResult.rows } });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch question.' } });
  }
});

router.post('/questions/:id/answers', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  const { body } = req.body;
  if (!body) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Answer body is required.' } });
  try {
    const answerId = crypto.randomUUID();
    await pgClient.query('INSERT INTO forum_answers (id, question_id, user_id, body) VALUES ($1, $2, $3, $4)', [answerId, req.params.id, req.user.id, body]);
    res.status(201).json({ success: true, data: { id: answerId }, message: 'Answer posted successfully.' });
  } catch (error) {
    console.error('Error posting answer:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to post answer.' } });
  }
});

export default router;
