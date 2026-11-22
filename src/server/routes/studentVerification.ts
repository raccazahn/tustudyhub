import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../auth.ts';
import type { AuthRequest } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';

const router = Router();

// GET /api/v1/verification/status - Check current user's verification status
router.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pgClient.query(
      `SELECT student_id, verification_status, college, department, academic_programme, academic_status, admin_review_notes, created_at
       FROM student_verifications
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.json({ success: true, data: null });
    }

    const row = result.rows[0];

    // MUST return 'verificationStatus' to match App.tsx check
    res.json({
      success: true,
      data: {
        verificationStatus: row.verification_status,
        studentId: row.student_id,
        college: row.college,
        department: row.department,
        academicProgramme: row.academic_programme,
        academicStatus: row.academic_status,
        adminReviewNotes: row.admin_review_notes,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch verification status.' } });
  }
});

// POST /api/v1/verification/submit - Submit new verification request
router.post('/submit', requireAuth, requireRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { studentId, fullName, college, department, academicProgramme, academicStatus, institutionalEmail, documentPath, documentType } = req.body;

    if (!studentId || !fullName || !college || !department || !academicProgramme) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Required fields are missing.' } });
    }

    // Check if already verified or pending
    const existing = await pgClient.query(
      'SELECT verification_status FROM student_verifications WHERE user_id = $1',
      [userId]
    );

    if (existing.rowCount > 0 && existing.rows[0].verification_status === 'VERIFIED') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_VERIFIED', message: 'Your account is already verified.' } });
    }

    if (existing.rowCount > 0) {
      // Update existing pending/rejected record
      await pgClient.query(
        `UPDATE student_verifications SET
          student_id = $1, full_name = $2, college = $3, department = $4,
          academic_programme = $5, academic_status = $6, institutional_email = $7,
          document_path = $8, document_type = $9, verification_status = 'PENDING', admin_review_notes = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $10`,
        [studentId, fullName, college, department, academicProgramme, academicStatus, institutionalEmail, documentPath, documentType, userId]
      );
    } else {
      // Insert new record
      await pgClient.query(
        `INSERT INTO student_verifications (
          user_id, student_id, full_name, college, department, academic_programme,
          academic_status, institutional_email, document_path, document_type, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')`,
        [userId, studentId, fullName, college, department, academicProgramme, academicStatus, institutionalEmail, documentPath, documentType]
      );
    }

    res.json({ success: true, message: 'Verification submitted successfully.' });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to submit verification.' } });
  }
});

// GET /api/v1/verification/admin/pending - Get all pending verifications (Admin only)
router.get('/admin/pending', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pgClient.query(
      `SELECT sv.id, sv.user_id, sv.student_id, sv.full_name, sv.college, sv.department, sv.academic_programme, sv.academic_status, sv.verification_status, sv.document_type, sv.document_path, sv.admin_review_notes, sv.created_at, u.email as user_email
       FROM student_verifications sv
       JOIN users u ON sv.user_id = u.id
       WHERE sv.verification_status IN ('PENDING', 'CORRECTION_REQUESTED')
       ORDER BY sv.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch pending verifications.' } });
  }
});

// PATCH /api/v1/verification/admin/:id/decision - Approve/Reject verification (Admin only)
router.patch('/admin/:id/decision', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['VERIFIED', 'REJECTED', 'CORRECTION_REQUESTED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status.' } });
    }

    if ((status === 'REJECTED' || status === 'CORRECTION_REQUESTED') && (!reviewNotes || reviewNotes.trim().length < 5)) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_NOTES', message: 'Review notes are required for rejections or corrections.' } });
    }

    await pgClient.query(
      `UPDATE student_verifications
       SET verification_status = $1, admin_review_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, reviewNotes || null, id]
    );

    // TODO: Trigger notification to student here in the future

    res.json({ success: true, message: `Application ${status.toLowerCase().replace('_', ' ')} successfully.` });
  } catch (error) {
    console.error('Error processing verification decision:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process decision.' } });
  }
});

export default router;
