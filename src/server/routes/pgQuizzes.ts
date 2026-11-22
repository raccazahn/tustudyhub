import { Router, type NextFunction, type Response } from 'express';
import crypto from 'node:crypto';
import type { QuestionType, Quiz, QuizAttempt, QuizQuestion, QuizVersionSnapshot } from '../../types/index.ts';
import { generateAndValidateQuiz } from '../aiQuizService.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { insertPgAudit } from '../db/pgRecords.ts';

const router = Router();
const quizSelect = `
  SELECT q.id, q.course_id AS "courseId", c.code AS "courseCode", c.title AS "courseTitle",
         q.creator_id AS "creatorId", COALESCE(q.creator_name, u.full_name) AS "creatorName",
         q.title, COALESCE(q.description, '') AS description, q.time_limit_minutes AS "timeLimitMinutes",
         q.pass_percentage AS "passPercentage", q.status, q.current_version AS "currentVersion",
         q.total_questions AS "totalQuestions", q.created_at AS "createdAt", q.updated_at AS "updatedAt"
  FROM quizzes q JOIN courses c ON c.id = q.course_id JOIN users u ON u.id = q.creator_id
`;

function usePostgres(next: NextFunction): boolean {
  if (pgClient.isPostgresEnabled()) return true;
  next();
  return false;
}

function inactive(user: AuthRequest['user'], res: Response): boolean {
  if (user?.status === 'PENDING_APPROVAL' || user?.status === 'REJECTED') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' } });
    return true;
  }
  if (user?.status === 'SUSPENDED') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' } });
    return true;
  }
  return false;
}

function formatQuestions(input: Array<{ id?: string; questionText: string; questionType?: QuestionType; orderIndex?: number; explanation?: string; choices: Array<{ id?: string; text: string; isCorrect?: boolean }> }>): QuizQuestion[] {
  return input.map((question, index) => ({
    id: question.id || crypto.randomUUID(),
    questionText: String(question.questionText).trim(),
    questionType: question.questionType || 'SINGLE_CHOICE',
    orderIndex: index + 1,
    explanation: question.explanation || 'Refer to course syllabus and lecture materials.',
    choices: question.choices.map((choice, choiceIndex) => ({
      id: choice.id || `c-${choiceIndex + 1}`,
      text: String(choice.text).trim(),
      isCorrect: Boolean(choice.isCorrect)
    }))
  }));
}

async function getQuiz(id: string) {
  const result = await pgClient.query(`${quizSelect} WHERE q.id = $1`, [id]);
  return result.rows[0] as (Quiz & { isAiGenerated?: boolean }) | undefined;
}

async function getVersion(id: string) {
  const result = await pgClient.query(`
    SELECT id, quiz_id AS "quizId", version_number AS "versionNumber", title,
           course_code AS "courseCode", course_title AS "courseTitle",
           time_limit_minutes AS "timeLimitMinutes", pass_percentage AS "passPercentage",
           questions, published_at AS "publishedAt"
    FROM quiz_versions WHERE id = $1
  `, [id]);
  return result.rows[0] as QuizVersionSnapshot | undefined;
}

async function getActiveVersion(quizId: string, version: number) {
  const result = await pgClient.query(`
    SELECT id, quiz_id AS "quizId", version_number AS "versionNumber", title,
           course_code AS "courseCode", course_title AS "courseTitle",
           time_limit_minutes AS "timeLimitMinutes", pass_percentage AS "passPercentage",
           questions, published_at AS "publishedAt"
    FROM quiz_versions WHERE quiz_id = $1 AND version_number = $2
  `, [quizId, version]);
  return result.rows[0] as QuizVersionSnapshot | undefined;
}

function publicQuestions(questions: QuizQuestion[]) {
  return questions.map(question => ({
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    orderIndex: question.orderIndex,
    choices: question.choices.map(choice => ({ id: choice.id, text: choice.text }))
  }));
}

function markQuestions(version: QuizVersionSnapshot, answers: Record<string, string[]>) {
  let correctCount = 0;
  const breakdown = version.questions.map(question => {
    const selected = Array.isArray(answers?.[question.id]) ? answers[question.id] : [];
    const correct = question.choices.filter(choice => choice.isCorrect).map(choice => choice.id);
    const isCorrect = correct.length === selected.length && correct.every(id => selected.includes(id));
    if (isCorrect) correctCount++;
    return { questionId: question.id, questionText: question.questionText, explanation: question.explanation,
      isCorrect, userSelected: selected, correctChoices: correct, choices: question.choices };
  });
  return { correctCount, breakdown, totalQuestions: version.questions.length,
    scorePercentage: version.questions.length ? Math.round(correctCount * 100 / version.questions.length) : 0 };
}

async function createQuizRecord(quiz: Quiz, snapshot: QuizVersionSnapshot, isAiGenerated: boolean, auditAction: string, actor: AuthRequest['user'], reqIp?: string) {
  await pgClient.transaction(async client => {
    await client.query(`INSERT INTO quizzes (id, course_id, creator_id, creator_name, title, description,
      time_limit_minutes, pass_percentage, status, current_version, total_questions, is_ai_generated)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [quiz.id, quiz.courseId, quiz.creatorId, quiz.creatorName, quiz.title, quiz.description, quiz.timeLimitMinutes,
        quiz.passPercentage, quiz.status, quiz.currentVersion, quiz.totalQuestions, isAiGenerated]);
    await client.query(`INSERT INTO quiz_versions (id, quiz_id, version_number, title, course_code, course_title,
      time_limit_minutes, pass_percentage, questions, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,
      [snapshot.id, snapshot.quizId, snapshot.versionNumber, snapshot.title, snapshot.courseCode, snapshot.courseTitle,
        snapshot.timeLimitMinutes, snapshot.passPercentage, JSON.stringify(snapshot.questions), snapshot.publishedAt]);
    await insertPgAudit(client, actor, auditAction, 'QUIZ', quiz.id,
      { title: quiz.title, course: quiz.courseCode, version: 1, questionsCount: quiz.totalQuestions }, reqIp);
  });
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (inactive(req.user, res)) return;
  const { courseId } = req.query as Record<string, string>;
  try {
    const values: unknown[] = [];
    const filters: string[] = [];
    if (!req.user || req.user.role === 'STUDENT') filters.push("q.status = 'PUBLISHED'");
    if (courseId) { values.push(courseId); filters.push(`q.course_id = $${values.length}`); }
    const result = await pgClient.query(`${quizSelect} ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY q.created_at DESC`, values);
    res.json({ success: true, data: result.rows, meta: { total: result.rowCount } });
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  if (inactive(req.user, res)) return;
  try {
    const quiz = await getQuiz((req.params.id as string));
    if (!quiz) {
      res.status(404).json({ success: false, error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' } });
      return;
    }
    const privileged = req.user && ['ADMINISTRATOR', 'LECTURER'].includes(req.user.role);
    if (quiz.status !== 'PUBLISHED' && !privileged) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This assessment is currently unpublished or pending academic review.' } });
      return;
    }
    const version = await getActiveVersion(quiz.id, quiz.currentVersion);
    if (!version) {
      res.status(404).json({ success: false, error: { code: 'VERSION_NOT_FOUND', message: 'Published quiz version not found.' } });
      return;
    }
    res.json({ success: true, data: { quiz, versionSnapshot: { ...version, questions: publicQuestions(version.questions) } } });
  } catch (error) { next(error); }
});

router.post('/:id/submit', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return;
  if (inactive(req.user, res)) return;
  if (!usePostgres(next)) return;
  const { versionId, answers, timeSpentSeconds } = req.body as { versionId?: string; answers?: Record<string, string[]>; timeSpentSeconds?: number };
  try {
    const quiz = await getQuiz((req.params.id as string));
    if (!quiz) {
      res.status(404).json({ success: false, error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' } });
      return;
    }
    if (quiz.status !== 'PUBLISHED' && !['ADMINISTRATOR', 'LECTURER'].includes(req.user.role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot take an unpublished quiz.' } });
      return;
    }
    const version = versionId ? await getVersion(versionId) : undefined;
    if (!version || version.quizId !== quiz.id) {
      res.status(400).json({ success: false, error: { code: 'INVALID_VERSION', message: 'Invalid quiz version reference.' } });
      return;
    }
    const marking = markQuestions(version, answers || {});
    const passed = marking.scorePercentage >= version.passPercentage;
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(), quizId: quiz.id, quizVersionId: version.id, quizVersionNumber: version.versionNumber,
      quizTitle: quiz.title, courseCode: quiz.courseCode, userId: req.user.id, userName: req.user.fullName,
      scorePercentage: marking.scorePercentage, totalQuestions: marking.totalQuestions,
      correctAnswersCount: marking.correctCount, passed, completedAt: new Date().toISOString(),
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 60), userAnswers: answers || {}
    };
    await pgClient.transaction(async client => {
      await client.query(`INSERT INTO quiz_attempts (id, quiz_id, quiz_version_id, quiz_version_number, user_id, user_name,
        score_percentage, total_questions, correct_answers_count, passed, completed_at, time_spent_seconds, user_answers, quiz_title, course_code)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)`,
        [attempt.id, attempt.quizId, attempt.quizVersionId, attempt.quizVersionNumber, req.user!.id, req.user!.fullName,
          attempt.scorePercentage, attempt.totalQuestions, attempt.correctAnswersCount, attempt.passed, attempt.completedAt,
          attempt.timeSpentSeconds, JSON.stringify(attempt.userAnswers), attempt.quizTitle, attempt.courseCode]);
      await insertPgAudit(client, req.user, 'QUIZ_ATTEMPT_COMPLETED', 'QUIZ', quiz.id,
        { attemptId: attempt.id, scorePercentage: attempt.scorePercentage, passed, version: version.versionNumber }, req.ip);

      // Trigger notification for the student about their quiz result
      const resultMsg = passed ? 'passed' : 'did not pass';
      await client.query(`INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type) VALUES ($1, 'QUIZ_RESULT_AVAILABLE', $2, $3, $4, 'QUIZ')`,
        [req.user!.id, `Quiz Result: ${quiz.title}`, `You scored ${marking.scorePercentage}% and ${resultMsg} on "${quiz.title}".`, quiz.id]);
    });
    res.json({ success: true, data: { attempt, isAnonymous: false, review: {
      scorePercentage: marking.scorePercentage, passed, correctCount: marking.correctCount,
      totalQuestions: marking.totalQuestions, passPercentage: version.passPercentage,
      questionBreakdown: marking.breakdown
    } } });
  } catch (error) { next(error); }
});

router.post('/attempts/transfer', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  const { attempts } = req.body as { attempts?: Array<Partial<QuizAttempt>> };
  if (!Array.isArray(attempts) || !attempts.length) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'An array of attempts to transfer is required.' } });
    return;
  }
  try {
    const transferred: QuizAttempt[] = [];
    await pgClient.transaction(async client => {
      for (const item of attempts) {
        if (!item.quizId || !item.quizVersionId) continue;
        const quizResult = await client.query(`${quizSelect} WHERE q.id = $1`, [item.quizId]);
        const versionResult = await client.query('SELECT id, quiz_id AS "quizId", version_number AS "versionNumber", title, course_code AS "courseCode", course_title AS "courseTitle", time_limit_minutes AS "timeLimitMinutes", pass_percentage AS "passPercentage", questions, published_at AS "publishedAt" FROM quiz_versions WHERE id = $1', [item.quizVersionId]);
        if (!quizResult.rowCount || !versionResult.rowCount) continue;
        const quiz = quizResult.rows[0] as Quiz;
        const version = versionResult.rows[0] as QuizVersionSnapshot;
        if (version.quizId !== quiz.id) continue;
        const answers = item.userAnswers || {};
        const marking = markQuestions(version, answers);
        const completedAt = item.completedAt || new Date().toISOString();
        const duplicate = await client.query('SELECT 1 FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2 AND quiz_version_id = $3 AND completed_at = $4',
          [req.user!.id, quiz.id, version.id, completedAt]);
        if (duplicate.rowCount) continue;
        const record: QuizAttempt = {
          id: crypto.randomUUID(), quizId: quiz.id, quizVersionId: version.id, quizVersionNumber: version.versionNumber,
          quizTitle: quiz.title, courseCode: quiz.courseCode, userId: req.user!.id, userName: req.user!.fullName,
          scorePercentage: marking.scorePercentage, totalQuestions: marking.totalQuestions,
          correctAnswersCount: marking.correctCount, passed: marking.scorePercentage >= version.passPercentage,
          completedAt, timeSpentSeconds: Math.max(0, Number(item.timeSpentSeconds) || 60), userAnswers: answers
        };
        await client.query(`INSERT INTO quiz_attempts (id, quiz_id, quiz_version_id, quiz_version_number, user_id, user_name,
          score_percentage, total_questions, correct_answers_count, passed, completed_at, time_spent_seconds, user_answers, quiz_title, course_code)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)`,
          [record.id, record.quizId, record.quizVersionId, record.quizVersionNumber, record.userId, record.userName,
            record.scorePercentage, record.totalQuestions, record.correctAnswersCount, record.passed, record.completedAt,
            record.timeSpentSeconds, JSON.stringify(record.userAnswers), record.quizTitle, record.courseCode]);
        transferred.push(record);
      }
      if (transferred.length) await insertPgAudit(client, req.user, 'ANONYMOUS_ATTEMPTS_TRANSFERRED', 'USER', req.user!.id, { count: transferred.length }, req.ip);
    });
    res.json({ success: true, data: { transferredCount: transferred.length, attempts: transferred,
      message: `Successfully transferred ${transferred.length} local practice attempt(s) into your account.` } });
  } catch (error) { next(error); }
});

router.get('/attempts/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  try {
    const result = await pgClient.query('SELECT id, quiz_id AS "quizId", quiz_version_id AS "quizVersionId", quiz_version_number AS "quizVersionNumber", quiz_title AS "quizTitle", course_code AS "courseCode", user_id AS "userId", user_name AS "userName", score_percentage AS "scorePercentage", total_questions AS "totalQuestions", correct_answers_count AS "correctAnswersCount", passed, completed_at AS "completedAt", time_spent_seconds AS "timeSpentSeconds", user_answers AS "userAnswers" FROM quiz_attempts WHERE user_id = $1 ORDER BY completed_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.get('/attempts/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.query('SELECT id, quiz_id AS "quizId", quiz_version_id AS "quizVersionId", quiz_version_number AS "quizVersionNumber", quiz_title AS "quizTitle", course_code AS "courseCode", user_id AS "userId", user_name AS "userName", score_percentage AS "scorePercentage", total_questions AS "totalQuestions", correct_answers_count AS "correctAnswersCount", passed, completed_at AS "completedAt", time_spent_seconds AS "timeSpentSeconds", user_answers AS "userAnswers" FROM quiz_attempts WHERE id = $1', [(req.params.id as string)]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt record not found.' } });
      return;
    }
    const attempt = result.rows[0] as QuizAttempt;
    const privileged = req.user && ['LECTURER', 'ADMINISTRATOR', 'MODERATOR'].includes(req.user.role);
    if ((!req.user || req.user.id !== attempt.userId) && !privileged) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to view this attempt record.' } });
      return;
    }
    res.json({ success: true, data: { attempt, versionSnapshot: await getVersion(attempt.quizVersionId) || null } });
  } catch (error) { next(error); }
});

router.get('/:id/attempts', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  try {
    const result = await pgClient.query('SELECT id, quiz_id AS "quizId", quiz_version_id AS "quizVersionId", quiz_version_number AS "quizVersionNumber", quiz_title AS "quizTitle", course_code AS "courseCode", user_id AS "userId", user_name AS "userName", score_percentage AS "scorePercentage", total_questions AS "totalQuestions", correct_answers_count AS "correctAnswersCount", passed, completed_at AS "completedAt", time_spent_seconds AS "timeSpentSeconds", user_answers AS "userAnswers" FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 ORDER BY completed_at DESC', [(req.params.id as string), req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  const { courseId, title, description, timeLimitMinutes, passPercentage, questions } = req.body;
  if (!courseId || !title || !Array.isArray(questions) || !questions.length) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Course, title, and at least one question are required.' } });
    return;
  }
  try {
    const courseResult = await pgClient.query<{ id: string; code: string; title: string }>('SELECT id, code, title FROM courses WHERE id = $1', [courseId]);
    if (!courseResult.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    const course = courseResult.rows[0];
    if (req.user.role === 'LECTURER' && !(req.user.assignedCourseCodes || []).includes(course.code)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Institutional Policy: You are not authorized to create quizzes for ${course.code}.` } });
      return;
    }
    const questionsFormatted = formatQuestions(questions);
    const quiz: Quiz = { id: crypto.randomUUID(), courseId: course.id, courseCode: course.code, courseTitle: course.title,
      creatorId: req.user.id, creatorName: req.user.fullName, title: String(title).trim(), description: description ? String(description).trim() : '',
      timeLimitMinutes: Number(timeLimitMinutes) || 15, passPercentage: Number(passPercentage) || 60, status: 'PUBLISHED',
      currentVersion: 1, totalQuestions: questionsFormatted.length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const snapshot: QuizVersionSnapshot = { id: crypto.randomUUID(), quizId: quiz.id, versionNumber: 1, title: quiz.title,
      courseCode: course.code, courseTitle: course.title, timeLimitMinutes: quiz.timeLimitMinutes,
      passPercentage: quiz.passPercentage, publishedAt: new Date().toISOString(), questions: questionsFormatted };
    await createQuizRecord(quiz, snapshot, false, 'QUIZ_CREATED_AND_PUBLISHED', req.user, req.ip);
    res.status(201).json({ success: true, data: quiz, message: 'Quiz created and version 1 published successfully.' });
  } catch (error) { next(error); }
});

router.post('/generate-ai', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  if (!req.user) return;
  const { courseId, topic, questionCount, difficulty, syllabusContext } = req.body;
  if (!courseId || !topic) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Course ID and Topic are required.' } });
    return;
  }
  try {
    const courseResult = await pgClient.query<{ id: string; code: string; title: string; description: string }>('SELECT id, code, title, description FROM courses WHERE id = $1', [courseId]);
    if (!courseResult.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    const course = courseResult.rows[0];
    if (req.user.role === 'LECTURER' && !(req.user.assignedCourseCodes || []).includes(course.code)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `You are not authorized to create quizzes for ${course.code}.` } });
      return;
    }
    const generated = await generateAndValidateQuiz({
      courseCode: course.code,
      courseTitle: course.title,
      topic: String(topic).trim(),
      questionCount: Number(questionCount) || 5,
      difficulty: difficulty || 'INTERMEDIATE',
      syllabusContext: syllabusContext || course.description,
      // sourceMaterial: req.body.sourceMaterial || 'syllabus' // Temporarily commented out to satisfy TS
    });
    const questions = formatQuestions(generated.questions);
    const quiz: Quiz = { id: crypto.randomUUID(), courseId: course.id, courseCode: course.code, courseTitle: course.title,
      creatorId: req.user.id, creatorName: req.user.fullName, title: generated.title, description: generated.description,
      timeLimitMinutes: generated.timeLimitMinutes, passPercentage: generated.passPercentage, status: 'DRAFT', currentVersion: 1,
      totalQuestions: questions.length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const snapshot: QuizVersionSnapshot = { id: crypto.randomUUID(), quizId: quiz.id, versionNumber: 1, title: quiz.title,
      courseCode: course.code, courseTitle: course.title, timeLimitMinutes: quiz.timeLimitMinutes,
      passPercentage: quiz.passPercentage, publishedAt: new Date().toISOString(), questions };
    await createQuizRecord(quiz, snapshot, true, 'AI_QUIZ_GENERATED_DRAFT', req.user, req.ip);
    res.status(201).json({ success: true, data: { quiz, versionSnapshot: snapshot, validationReport: generated.validationReport, source: generated.rawSource },
      message: generated.validationReport.isValid ? 'AI assessment drafted and verified against academic standards. Ready for lecturer review.' : 'AI assessment drafted with warnings. Please review flagged questions before approving.' });
  } catch (error) { next(error); }
});

router.post('/:id/approve', requireAuth, requireRole(['LECTURER', 'ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!usePostgres(next)) return;
  try {
    const result = await pgClient.transaction(async client => {
      const current = await client.query(`${quizSelect} WHERE q.id = $1 FOR UPDATE OF q`, [(req.params.id as string)]);
      if (!current.rowCount) return { missing: true as const };
      const quiz = current.rows[0] as Quiz;
      if (req.user?.role === 'LECTURER' && !(req.user.assignedCourseCodes || []).includes(quiz.courseCode)) return { denied: true as const, courseCode: quiz.courseCode };
      const { title, description, timeLimitMinutes, passPercentage, questions } = req.body;
      const updatedTitle = title ? String(title).trim() : quiz.title;
      const updatedDescription = description === undefined ? quiz.description : String(description).trim();
      const updatedLimit = timeLimitMinutes ? Number(timeLimitMinutes) : quiz.timeLimitMinutes;
      const updatedPass = passPercentage ? Number(passPercentage) : quiz.passPercentage;
      let updatedQuestions: QuizQuestion[] | undefined;
      if (Array.isArray(questions)) updatedQuestions = formatQuestions(questions);
      const active = await client.query<{ id: string; questions: QuizQuestion[] }>('SELECT id, questions FROM quiz_versions WHERE quiz_id = $1 AND version_number = $2 FOR UPDATE', [quiz.id, quiz.currentVersion]);
      const total = updatedQuestions?.length ?? active.rows[0]?.questions?.length ?? quiz.totalQuestions;
      await client.query('UPDATE quizzes SET title = $1, description = $2, time_limit_minutes = $3, pass_percentage = $4, status = $5, total_questions = $6, updated_at = NOW() WHERE id = $7',
        [updatedTitle, updatedDescription, updatedLimit, updatedPass, 'PUBLISHED', total, quiz.id]);

      // Trigger notification for all active students about the new quiz
      await client.query(`INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type)
        SELECT id, 'QUIZ_PUBLISHED', $1, $2, $3, 'QUIZ' FROM users WHERE role = 'STUDENT' AND status = 'ACTIVE'`,
        [`New Quiz: ${updatedTitle}`, `A new quiz "${updatedTitle}" is now available for course ${quiz.courseCode}.`, quiz.id]);

      if (active.rowCount && updatedQuestions) await client.query('UPDATE quiz_versions SET title = $1, time_limit_minutes = $2, pass_percentage = $3, questions = $4::jsonb WHERE id = $5',
        [updatedTitle, updatedLimit, updatedPass, JSON.stringify(updatedQuestions), active.rows[0].id]);
      await insertPgAudit(client, req.user, 'AI_QUIZ_APPROVED_AND_PUBLISHED', 'QUIZ', quiz.id,
        { title: updatedTitle, course: quiz.courseCode, approvedBy: req.user?.fullName }, req.ip);
      const updated = await client.query(`${quizSelect} WHERE q.id = $1`, [quiz.id]);
      return updated.rows[0];
    });
    if ('missing' in result) {
      res.status(404).json({ success: false, error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' } });
      return;
    }
    if ('denied' in result) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `You are not authorized to verify quizzes for ${result.courseCode}.` } });
      return;
    }
    res.json({ success: true, data: result, message: `Quiz "${result.title}" has been academically verified and published to students.` });
  } catch (error) { next(error); }
});

export default router;
