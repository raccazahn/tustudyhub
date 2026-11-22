import fs from 'fs';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Quiz & Automated Marking Engine Routes (/api/v1/quizzes)
 * Handles quiz versions, MCQ creation, automated grading, and immutable attempt tracking.
 */

import crypto from 'crypto';
import { Response, Router } from 'express';
import type { QuestionType, Quiz, QuizAttempt, QuizQuestion, QuizVersionSnapshot } from '../../types/index.ts';
import { generateAndValidateQuiz } from '../aiQuizService.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { db } from '../db.ts';
import { extractText, parseQuestions } from '../services/documentParser.ts';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const router = Router();

// GET /api/v1/quizzes
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query as Record<string, string>;
    const list = await db.getQuizzesFromDB(courseId, req.user?.role);
    res.json({ success: true, data: list, meta: { total: list.length } });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch quizzes.' } });
  }
});

// GET /api/v1/quizzes/:id (Get quiz for taking - hides isCorrect!)
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quizzes = await db.getQuizzesFromDB();
    const quiz = quizzes.find((q: any) => q.id === (req.params.id as string));

    if (!quiz) {
      res.status(404).json({ success: false, error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' } });
      return;
    }

    const activeVersion = await db.getQuizVersionFromDB(quiz.id, quiz.current_version || 1);
    if (!activeVersion) {
      res.status(404).json({ success: false, error: { code: 'VERSION_NOT_FOUND', message: 'Published quiz version not found.' } });
      return;
    }

    const sanitizedQuestions = activeVersion.questions.map((q: any, index: number) => ({
      id: q.id || `q-${index + 1}`,
      questionText: q.questionText,
      questionType: q.questionType || 'SINGLE_CHOICE',
      orderIndex: index + 1,
      choices: q.choices.map((c: any, cIdx: number) => ({
        id: c.id || `c-${cIdx + 1}`,
        text: c.text
      }))
    }));

    res.json({
      success: true,
      data: {
        quiz,
        versionSnapshot: {
          id: activeVersion.id,
          quizId: activeVersion.quiz_id,
          versionNumber: activeVersion.version_number,
          title: activeVersion.title,
          courseCode: activeVersion.course_code,
          courseTitle: activeVersion.course_title,
          timeLimitMinutes: activeVersion.time_limit_minutes,
          passPercentage: activeVersion.pass_percentage,
          questions: sanitizedQuestions
        }
      }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch quiz.' } });
  }
});

// POST /api/v1/quizzes (Create new quiz & publish version)
router.post('/', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const { courseId, title, description, timeLimitMinutes, passPercentage, questions } = req.body;

  try {
    const course = db.courses.get(courseId);
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }

    const quizId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    const newQuizData = {
      id: quizId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      creatorId: req.user.id,
      creatorName: req.user.fullName,
      title: title.trim(),
      description: description ? description.trim() : '',
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      passPercentage: Number(passPercentage) || 60,
      status: 'PUBLISHED',
      currentVersion: 1,
      totalQuestions: questions.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const snapshotData = {
      id: versionId,
      quizId: quizId,
      versionNumber: 1,
      title: newQuizData.title,
      courseCode: course.code,
      courseTitle: course.title,
      timeLimitMinutes: newQuizData.timeLimitMinutes,
      passPercentage: newQuizData.passPercentage,
      publishedAt: new Date().toISOString(),
      questions: questions
    };

    await db.insertQuizIntoDB(newQuizData);
    await db.insertQuizVersionIntoDB(snapshotData);

    res.status(201).json({ success: true, data: newQuizData, message: 'Quiz created successfully.' });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create quiz.' } });
  }
});

// POST /api/v1/quizzes/generate-ai (Hybrid AI generation with rule-based validation)
router.post('/generate-ai', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const { courseId, topic, questionCount, difficulty, syllabusContext, mode, sourceText } = req.body;

  try {
    const course = db.courses.get(courseId);
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }

    const generated = await generateAndValidateQuiz({
      courseCode: course.code,
      courseTitle: course.title,
      topic: topic.trim(),
      questionCount: Number(questionCount) || 5,
      difficulty: difficulty || 'INTERMEDIATE',
      syllabusContext: syllabusContext || course.description,
      mode: mode || 'GENERATE',
      sourceText: sourceText
    });

    const quizId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    const draftQuizData = {
      id: quizId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      creatorId: req.user.id,
      creatorName: req.user.fullName,
      title: generated.title,
      description: generated.description,
      timeLimitMinutes: generated.timeLimitMinutes,
      passPercentage: generated.passPercentage,
      status: 'DRAFT',
      currentVersion: 1,
      totalQuestions: generated.questions.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const draftSnapshotData = {
      id: versionId,
      quizId: quizId,
      versionNumber: 1,
      title: draftQuizData.title,
      courseCode: course.code,
      courseTitle: course.title,
      timeLimitMinutes: draftQuizData.timeLimitMinutes,
      passPercentage: draftQuizData.passPercentage,
      publishedAt: new Date().toISOString(),
      questions: generated.questions
    };

    await db.insertQuizIntoDB(draftQuizData);
    await db.insertQuizVersionIntoDB(draftSnapshotData);

    res.status(201).json({
      success: true,
      data: {
        quiz: draftQuizData,
        versionSnapshot: draftSnapshotData,
        validationReport: generated.validationReport,
        source: generated.rawSource
      },
      message: generated.validationReport.isValid
        ? 'AI assessment drafted and verified against academic standards. Ready for lecturer review.'
        : 'AI assessment drafted with warnings. Please review flagged questions before approving.'
    });
  } catch (err: any) {
    console.error('AI Quiz Generation Error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'GENERATION_FAILED', message: err?.message || 'Failed to generate questions.' }
    });
  }
});

// PATCH /api/v1/quizzes/:id/status - Update quiz status (PUBLISHED/ARCHIVED)
router.patch('/:id/status', requireAuth, requireRole(['ADMINISTRATOR', 'LECTURER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['PUBLISHED', 'ARCHIVED', 'DRAFT'].includes(status)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status value.' } });
      return;
    }

    const updatedQuiz = await db.updateQuizStatusInDB((req.params.id as string), status);

    if (!updatedQuiz) {
      res.status(404).json({ success: false, error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' } });
      return;
    }

    res.json({
      success: true,
      data: updatedQuiz,
      message: `Quiz status updated to ${status}.`
    });
  } catch (error) {
    console.error('Error updating quiz status:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update quiz status.' } });
  }
});

// DELETE /api/v1/quizzes/:id - Permanently delete a quiz
router.delete('/:id', requireAuth, requireRole(['ADMINISTRATOR', 'LECTURER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.deleteQuizFromDB((req.params.id as string));
    res.json({
      success: true,
      message: 'Quiz and all associated data have been permanently deleted.'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete quiz.' } });
  }
});


// POST /api/v1/quizzes/parse-document
router.post('/parse-document', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), upload.single('file'), async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: { message: 'No file uploaded.' } });
            return;
        }

        console.log('📄 Parsing file:', req.file.originalname, '| Mimetype:', req.file.mimetype);

        const text = await extractText(req.file.path, req.file.mimetype);
        console.log('✅ Extracted text length:', text ? text.length : 'UNDEFINED');

        const questions = parseQuestions(text || '');
        console.log('🧩 Parsed', questions.length, 'questions');

        fs.unlinkSync(req.file.path); // Clean up temp file

        res.json({ success: true, data: questions, meta: { total: questions.length } });
    } catch (error: any) {
        console.error('❌ Parse document error:', error);
        res.status(500).json({ success: false, error: { message: error.message || 'Failed to parse document' } });
    }
});

export default router;
