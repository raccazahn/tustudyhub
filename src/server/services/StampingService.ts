/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Official PDF Stamping Service
 * Minimalist stamp: Logo + QR Code only.
 */

import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

export interface StampingResult {
  success: boolean;
  stampedInternalFilePath?: string;
  stampedFileHash?: string;
  error?: string;
}

export class StampingService {
  public static async stampDocument(
    originalFilePath: string,
    documentTitle: string,
    verificationToken: string,
    approvalDate: string
  ): Promise<StampingResult> {
    try {
      if (!originalFilePath || !fsSync.existsSync(originalFilePath)) {
        return { success: false, error: 'Original file not found' };
      }
      const originalPdfBytes = await fs.readFile(originalFilePath);
      const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: false });

      // 1. Generate QR Code
      const baseUrl = (process.env.APP_URL || 'https://tustudyhub.com').replace(/\/+$/, '');
      const verifyUrl = `${baseUrl}/#verify?token=${encodeURIComponent(verificationToken)}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#1C1A17', light: '#FFFFFF' }
      });
      const qrCodeImageBytes = Uint8Array.from(Buffer.from(qrCodeDataUrl.split(',')[1], 'base64'));
      const qrImage = await pdfDoc.embedPng(qrCodeImageBytes);

      // 2. Load Logo
      const logoPath = path.join(process.cwd(), 'public', 'pwa-192x192.png');
      let logoImage: any = null;
      if (fsSync.existsSync(logoPath)) {
        logoImage = await pdfDoc.embedPng(fsSync.readFileSync(logoPath));
      }

      // 3. Stamp every page (Logo + QR only)
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width } = page.getSize();

        const bottomMargin = 20;
        const rightMargin = 25;
        const rightEdge = width - rightMargin;

        // Sizes
        const qrSize = 70;
        const logoSize = 28;
        const gapBetween = 8;

        // Position: QR on the right, logo to its left
        const qrX = rightEdge - qrSize;
        const qrY = bottomMargin;
        const logoX = qrX - logoSize - gapBetween;
        const logoY = qrY + (qrSize - logoSize) / 2; // vertically center logo with QR

        // Draw QR
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

        // Draw logo beside QR
        if (logoImage) {
          page.drawImage(logoImage, { x: logoX, y: logoY, width: logoSize, height: logoSize });
        }
      }

      // 4. Save + hash + write
      const stampedPdfBytes = await pdfDoc.save();
      const stampedFileHash = crypto.createHash('sha256').update(stampedPdfBytes).digest('hex');

      const stampedDir = path.join(process.cwd(), 'uploads', 'documents', 'stamped');
      await fs.mkdir(stampedDir, { recursive: true, mode: 0o700 });
      const stampedFileName = `stamped-${crypto.randomUUID()}.pdf`;
      const stampedFilePath = path.join(stampedDir, stampedFileName);
      await fs.writeFile(stampedFilePath, stampedPdfBytes);

      return { success: true, stampedInternalFilePath: stampedFileName, stampedFileHash };
    } catch (error) {
      console.error('PDF Stamping Failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown stamping error' };
    }
  }
}
