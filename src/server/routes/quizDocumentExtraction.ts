/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Quiz Document Extraction Route
 * Delegates to the unified documentParser service (pdf2json + mammoth).
 * No AI API required. No duplicate parsing logic.
 */

import fs from 'fs';
import { Router, Response } from 'express';
import multer from 'multer';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { extractText, parseQuestions } from '../services/documentParser.ts';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/v1/quizzes/extract-document
// Unified endpoint: uploads PDF/DOCX/TXT and returns parsed questions.
router.post('/extract-document', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: { message: 'No file uploaded.' } });
            return;
        }

        console.log('📄 Extracting:', req.file.originalname, '| Mimetype:', req.file.mimetype);

        const text = await extractText(req.file.path, req.file.mimetype);
        const questions = parseQuestions(text || '');

        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

        res.json({
            success: true,
            data: questions,
            meta: {
                total: questions.length,
                source: req.file.originalname,
                textLength: text ? text.length : 0
            }
        });
    } catch (error: any) {
        console.error('❌ Extraction error:', error);
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to extract document.' }
        });
    }
});

export default router;
