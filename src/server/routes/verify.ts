/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Document Verification Engine Routes (/api/v1/verify)
 * Public metadata lookup, QR code generation, tamper-resistant validation,
 * and authorized revocation workflow.
 */

import { Response, Router } from 'express';
import QRCode from 'qrcode';
import type { PublicVerificationResult } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { db } from '../db.ts';

const router = Router();

// GET /api/v1/verify/:token (Public Verification Lookup)
router.get('/:token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const token = (req.params.token as string).trim().toUpperCase();

  // Find document with this token
  const doc = Array.from(db.documents.values()).find(
    d => d.verificationToken.toUpperCase() === token
  );

  if (!doc) {
    res.status(404).json({
      success: false,
      error: {
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'The requested verification token could not be found in the TuStudyHub institutional registry.'
      }
    });
    return;
  }

  const verification = db.documentVerifications.get(doc.id);
  const status = verification ? verification.status : (doc.isVerified ? 'VERIFIED' : 'PENDING');

  // Generate QR Code data URL linking to the public verification page
  const verificationUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}/verify/${token}`;
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#8A3E12', // Clay 700
        light: '#FFFFFF'
      }
    });
  } catch {
    // QR code generation fallback
  }

  // Permitted Public Metadata (Strictly excludes student PII and unauthenticated private download links)
  const publicRecord: PublicVerificationResult = {
    isAuthentic: status === 'VERIFIED',
    verificationToken: doc.verificationToken,
    documentId: doc.id,
    title: doc.title,
    courseCode: doc.courseCode,
    courseTitle: doc.courseTitle,
    departmentName: doc.departmentName,
    category: doc.category,
    academicYear: doc.academicYear,
    fileHash: doc.fileHash,
    status,
    verifiedAt: verification?.verifiedAt || doc.verifiedAt,
    verifiedByTitle: verification?.verifiedByName
      ? `Institutional Reviewer (${verification.verifiedByName})`
      : 'Institutional Academic Review Board',
    revocationReason: verification?.revocationReason,
    revokedAt: verification?.revokedAt,
    qrCodeUrl: qrCodeDataUrl
  };

  db.logAudit(
    undefined,
    'PUBLIC_VERIFICATION_LOOKUP',
    'VERIFICATION',
    doc.id,
    { token, isAuthentic: publicRecord.isAuthentic, status },
    req.ip
  );

  res.json({
    success: true,
    data: publicRecord
  });
});

// POST /api/v1/verify/:token/revoke (Authorized Revocation)
router.post('/:token/revoke', requireAuth, requireRole(['ADMINISTRATOR', 'MODERATOR']), (req: AuthRequest, res: Response): void => {
  if (!req.user) return;
  const token = (req.params.token as string).trim().toUpperCase();
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({
      success: false,
      error: { code: 'REASON_REQUIRED', message: 'A recorded institutional reason is mandatory when revoking document verification.' }
    });
    return;
  }

  const doc = Array.from(db.documents.values()).find(
    d => d.verificationToken.toUpperCase() === token
  );

  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'DOC_NOT_FOUND', message: 'Document not found.' } });
    return;
  }

  const verification = db.documentVerifications.get(doc.id);
  const now = new Date().toISOString();

  if (verification) {
    verification.status = 'REVOKED';
    verification.revocationReason = reason.trim();
    verification.revokedBy = req.user.id;
    verification.revokedByName = req.user.fullName;
    verification.revokedAt = now;
  }

  doc.status = 'RESTRICTED';
  doc.isVerified = false;
  doc.updatedAt = now;

  db.logAudit(
    { id: req.user.id, name: req.user.fullName, role: req.user.role },
    'VERIFICATION_REVOKED',
    'VERIFICATION',
    doc.id,
    { token, reason },
    req.ip
  );

  res.json({
    success: true,
    data: {
      message: `Document verification for ${doc.title} (${doc.verificationToken}) has been officially revoked.`,
      status: 'REVOKED'
    }
  });
});

export default router;
