import { Router, type NextFunction, type Response } from 'express';
import QRCode from 'qrcode';
import type { PublicVerificationResult } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { insertPgAudit } from '../db/pgRecords.ts';

const router = Router();

function usePostgres(next: NextFunction): boolean {
  if (pgClient.isPostgresEnabled()) return true;
  next();
  return false;
}

router.get('/:token', async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  const token = (req.params.token as string).trim().toUpperCase();
  try {
    const result = await pgClient.query(`
      SELECT doc.id, doc.verification_token AS "verificationToken", doc.title,
             c.code AS "courseCode", c.title AS "courseTitle", d.name AS "departmentName",
             doc.category, doc.academic_year AS "academicYear", doc.file_hash AS "fileHash",
             COALESCE(v.status, CASE WHEN doc.is_verified THEN 'VERIFIED'::verification_status ELSE 'PENDING'::verification_status END) AS status,
             COALESCE(v.verified_at, doc.verified_at) AS "verifiedAt",
             v.verified_by_name AS "verifiedByName", v.revocation_reason AS "revocationReason",
             v.revoked_at AS "revokedAt", v.stamped_file_hash AS "stampedFileHash"
      FROM documents doc JOIN courses c ON c.id = doc.course_id
      JOIN departments d ON d.id = c.department_id
      LEFT JOIN LATERAL (SELECT * FROM document_verifications dv WHERE dv.document_id = doc.id ORDER BY dv.created_at DESC LIMIT 1) v ON TRUE
      WHERE upper(doc.verification_token) = $1
    `, [token]);
    if (!result.rowCount) {
      res.status(404).json({
      success: false,
      error: {
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'The requested verification token could not be found in the TuStudyHub institutional registry.',
        status: 'INVALID'
      }
    });
      return;
    }
    const doc = result.rows[0];
    const verificationUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}/verify/${token}`;
    let qrCodeDataUrl = '';
    try { qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 256, color: { dark: '#8A3E12', light: '#FFFFFF' } }); } catch { /* QR is optional metadata. */ }
    const isAuthentic = doc.status === 'VERIFIED';
    const publicRecord: PublicVerificationResult = {
      isAuthentic,
            verificationToken: doc.verificationToken,
      documentId: doc.id,
      title: doc.title,
      courseCode: doc.courseCode,
      courseTitle: doc.courseTitle,
      departmentName: doc.departmentName,
      category: doc.category,
      academicYear: doc.academicYear,
      fileHash: doc.fileHash,
      stampedFileHash: doc.stampedFileHash ?? undefined,
      status: doc.status,
      verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : undefined,
      verifiedByTitle: doc.verifiedByName ? `Institutional Reviewer (${doc.verifiedByName})` : 'Institutional Academic Review Board',
      revocationReason: doc.revocationReason ?? undefined,
      revokedAt: doc.revokedAt ? new Date(doc.revokedAt).toISOString() : undefined,
      qrCodeUrl: qrCodeDataUrl
    };
    await pgClient.query(`INSERT INTO audit_logs (actor_name, actor_role, action, target_type, target_id, metadata, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)`, ['Public Visitor', 'VISITOR', 'PUBLIC_VERIFICATION_LOOKUP', 'VERIFICATION', doc.id,
      JSON.stringify({ token, isAuthentic, status: doc.status }), req.ip]);
    res.json({ success: true, data: publicRecord });
  } catch (error) { next(error); }
});

router.post('/:token/revoke', requireAuth, requireRole(['ADMINISTRATOR', 'MODERATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  const token = (req.params.token as string).trim().toUpperCase();
  const { reason } = req.body as { reason?: string };
  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: 'A recorded institutional reason is mandatory when revoking document verification.' } });
    return;
  }
  try {
    const result = await pgClient.transaction(async client => {
      const doc = await client.query<{ id: string; title: string; verificationToken: string }>(
        'SELECT id, title, verification_token AS "verificationToken" FROM documents WHERE upper(verification_token) = $1 FOR UPDATE', [token]);
      if (!doc.rowCount) return null;
      await client.query(`UPDATE document_verifications SET status = 'REVOKED', revocation_reason = $1,
        revoked_by = $2, revoked_by_name = $3, revoked_at = NOW() WHERE document_id = $4`,
        [reason.trim(), req.user!.id, req.user!.fullName, doc.rows[0].id]);
      await client.query("UPDATE documents SET status = 'RESTRICTED', is_verified = FALSE, updated_at = NOW() WHERE id = $1", [doc.rows[0].id]);
      await insertPgAudit(client, req.user, 'VERIFICATION_REVOKED', 'VERIFICATION', doc.rows[0].id,
        { token, reason: reason.trim() }, req.ip);
      return doc.rows[0];
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
      return;
    }
    res.json({ success: true, data: { message: `Document verification for ${result.title} (${result.verificationToken}) has been officially revoked.`, status: 'REVOKED' } });
  } catch (error) { next(error); }
});

export default router;
