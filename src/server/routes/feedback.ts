/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub User Feedback & Platform Review Routes (/api/v1/feedback)
 * Supports user suggestions, bug reports, content issues, and administrative triage.
 */

import crypto from 'crypto';
import { Response, Router } from 'express';
import type { Feedback, FeedbackCategory, FeedbackStatus } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { db } from '../db.ts';

const router = Router();

// POST /api/v1/feedback (Public or Authenticated submission)
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { category, title, description, rating, userEmail, userName } = req.body;

  if (!category || !title || !description) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Category, title, and description are required.' }
    });
    return;
  }

  const validCategories: FeedbackCategory[] = ['PLATFORM', 'COURSE_CONTENT', 'VERIFICATION', 'BUG', 'FEATURE_REQUEST', 'OTHER'];
  if (!validCategories.includes(category)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CATEGORY', message: `Category must be one of: ${validCategories.join(', ')}` }
    });
    return;
  }

  const user = req.user;
  const newFeedback: Feedback = {
    id: crypto.randomUUID(),
    userId: user?.id,
    userEmail: user?.email || userEmail?.trim() || undefined,
    userName: user?.fullName || userName?.trim() || 'Anonymous Scholar',
    userRole: user?.role || 'VISITOR',
    category,
    title: title.trim(),
    description: description.trim(),
    rating: rating ? Math.max(1, Math.min(5, Number(rating))) : undefined,
    status: 'NEW',
    createdAt: new Date().toISOString()
  };

  db.feedback.set(newFeedback.id, newFeedback);

  db.logAudit(
    user ? { id: user.id, name: user.fullName, role: user.role } : { name: newFeedback.userName, role: 'VISITOR' },
    'FEEDBACK_SUBMITTED',
    'FEEDBACK',
    newFeedback.id,
    { category: newFeedback.category, title: newFeedback.title },
    req.ip
  );

  res.status(201).json({
    success: true,
    data: newFeedback,
    message: 'Thank you for your feedback! Our institutional team will review your submission.'
  });
});

// GET /api/v1/feedback (Admin only - List all feedback with filters)
router.get('/', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const { status, category, q } = req.query as Record<string, string>;

  let list = Array.from(db.feedback.values());

  if (status && status !== 'ALL') {
    list = list.filter(f => f.status === status);
  }

  if (category && category !== 'ALL') {
    list = list.filter(f => f.category === category);
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    list = list.filter(f =>
      f.title.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query) ||
      (f.userName && f.userName.toLowerCase().includes(query)) ||
      (f.userEmail && f.userEmail.toLowerCase().includes(query))
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: list,
    meta: {
      total: list.length,
      newCount: Array.from(db.feedback.values()).filter(f => f.status === 'NEW').length,
      underReviewCount: Array.from(db.feedback.values()).filter(f => f.status === 'UNDER_REVIEW').length,
      plannedCount: Array.from(db.feedback.values()).filter(f => f.status === 'PLANNED').length,
      resolvedCount: Array.from(db.feedback.values()).filter(f => f.status === 'RESOLVED').length
    }
  });
});

// GET /api/v1/feedback/my (Authenticated user - view their own feedback submissions)
router.get('/my', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const list = Array.from(db.feedback.values())
    .filter(f => f.userId === req.user?.id || (f.userEmail && f.userEmail.toLowerCase() === req.user?.email.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sanitized = list.map(item => {
    const { adminNotes: _adminNotes, ...safeItem } = item;
    return safeItem;
  });

  res.json({ success: true, data: sanitized });
});

// GET /api/v1/feedback/:id (Admin only)
router.get('/:id', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const item = db.feedback.get((req.params.id as string));
  if (!item) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Feedback entry not found.' } });
    return;
  }
  res.json({ success: true, data: item });
});

// PUT /api/v1/feedback/:id/status (Admin only - Update status and add internal administrative notes)
router.put('/:id/status', requireAuth, requireRole(['ADMINISTRATOR']), (req: AuthRequest, res: Response): void => {
  const item = db.feedback.get((req.params.id as string));
  if (!item) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Feedback entry not found.' } });
    return;
  }

  const { status, adminNotes } = req.body;
  const validStatuses: FeedbackStatus[] = ['NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED'];

  if (status && !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` }
    });
    return;
  }

  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes.trim();
  item.reviewedBy = req.user?.id;
  item.reviewedByName = req.user?.fullName;
  item.reviewedAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();

  db.feedback.set(item.id, item);

  db.logAudit(
    { id: req.user?.id, name: req.user?.fullName, role: req.user?.role },
    'FEEDBACK_STATUS_UPDATED',
    'FEEDBACK',
    item.id,
    { newStatus: item.status, hasNotes: Boolean(item.adminNotes) },
    req.ip
  );

  res.json({
    success: true,
    data: item,
    message: `Feedback status updated to ${item.status}.`
  });
});

export default router;
