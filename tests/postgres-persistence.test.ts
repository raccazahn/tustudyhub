import { StorageService } from '../src/server/storage.ts';
import express from 'express';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import pg from 'pg';
import request from 'supertest';

import { authenticate, AuthService } from '../src/server/auth.ts';
import authRouter from '../src/server/routes/auth.ts';
import pgAcademicRouter from '../src/server/routes/pgAcademic.ts';
import pgAdminRouter from '../src/server/routes/pgAdmin.ts';
import pgDocumentsRouter from '../src/server/routes/pgDocuments.ts';
import pgFeedbackRouter from '../src/server/routes/pgFeedback.ts';
import pgQuizzesRouter from '../src/server/routes/pgQuizzes.ts';
import pgVerifyRouter from '../src/server/routes/pgVerify.ts';

const databaseUrl = process.env.DATABASE_URL;
const integrationEnabled = Boolean(databaseUrl);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', pgAdminRouter);
  app.use('/api/v1', pgAcademicRouter);
  app.use('/api/v1/documents', pgDocumentsRouter);
  app.use('/api/v1/verify', pgVerifyRouter);
  app.use('/api/v1/quizzes', pgQuizzesRouter);
  app.use('/api/v1/feedback', pgFeedbackRouter);
  app.use('/api', (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error.' } });
  });
  return app;
}

test('PostgreSQL core workflows persist across a new backend process', { skip: !integrationEnabled, timeout: 30000 }, async () => {
  const previousIntegrationFlag = process.env.PG_INTEGRATION_TESTS;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.PG_INTEGRATION_TESTS = '1';
  process.env.NODE_ENV = 'test';

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const ids = {
    admin: crypto.randomUUID(),
    registeredUser: '',
    college: crypto.randomUUID(),
    department: crypto.randomUUID(),
    course: crypto.randomUUID(),
    document: crypto.randomUUID(),
    lecturer: crypto.randomUUID(),
    quiz: '',
    attempt: '',
    feedback: ''
  };
  const suffix = crypto.randomUUID();
  const adminEmail = `stage3b-admin-${suffix}@example.test`;
  const adminName = 'Stage 3B Integration Administrator';
  const adminToken = AuthService.createToken({
    id: ids.admin,
    email: adminEmail,
    fullName: adminName,
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });
  const lecturerEmail = `stage3b-lecturer-${suffix}@example.test`;
  const lecturerName = 'Stage 3B Integration Lecturer';
  const lecturerToken = AuthService.createToken({
    id: ids.lecturer,
    email: lecturerEmail,
    fullName: lecturerName,
    role: 'LECTURER',
    status: 'ACTIVE',
    departmentId: ids.department,
    createdAt: new Date().toISOString()
  });
  const app = createApp();

  try {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, salt, iterations, algorithm, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [ids.admin, adminEmail, 'integration-test-hash', 'integration-test-salt', 220000, 'pbkdf2-sha512', adminName, 'ADMINISTRATOR', 'ACTIVE']
    );

    const registration = await request(app).post('/api/v1/auth/register').send({
      email: `stage3b-user-${suffix}@example.test`,
      password: 'Stage3B-Test-Password-92!',
      fullName: 'Stage 3B Persistent User',
      requestedRole: 'STUDENT'
    });
    assert.equal(registration.status, 201);
    ids.registeredUser = registration.body.data.user.id;
    assert.equal(registration.body.data.status, 'ACTIVE');

    const studentMe = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registration.body.data.token}`);
    assert.equal(studentMe.status, 200);
    assert.ok(studentMe.body.success);

    const visitorContributor = await request(app).post('/api/v1/auth/apply-contributor').send({});
    const visitorAdminUsers = await request(app).get('/api/v1/admin/users');
    assert.equal(visitorContributor.status, 401);
    assert.equal(visitorAdminUsers.status, 401);
    process.env.NODE_ENV = 'development';
    const visitorRoleSwitch = await request(app).post('/api/v1/auth/demo-switch').send({ role: 'ADMINISTRATOR' });
    process.env.NODE_ENV = 'test';
    assert.equal(visitorRoleSwitch.status, 401);

    const collegeResponse = await request(app)
      .post('/api/v1/colleges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `T${suffix.slice(0, 7)}`.toUpperCase(), name: 'Stage 3B Test College', description: 'Integration fixture' });
    assert.equal(collegeResponse.status, 201);
    ids.college = collegeResponse.body.data.id;

    const departmentResponse = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `D${suffix.slice(0, 7)}`.toUpperCase(), name: 'Stage 3B Test Department', collegeId: ids.college });
    assert.equal(departmentResponse.status, 201);
    ids.department = departmentResponse.body.data.id;

    const courseResponse = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: ids.department, code: `T${suffix.slice(0, 6)} 101`.toUpperCase(), title: 'Stage 3B Persistence', level: 100, semester: 'FIRST' });
    assert.equal(courseResponse.status, 201);
    ids.course = courseResponse.body.data.id;

    await pool.query(
      'INSERT INTO users (id, email, password_hash, salt, iterations, algorithm, full_name, role, status, department_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [ids.lecturer, lecturerEmail, 'integration-test-hash', 'integration-test-salt', 220000, 'pbkdf2-sha512', lecturerName, 'LECTURER', 'ACTIVE', ids.department]
    );
    await pool.query('INSERT INTO lecturer_course_assignments (lecturer_id, course_id) VALUES ($1,$2)', [ids.lecturer, ids.course]);
    // Generate a robust, fully valid PDF using the app's own service
    const validPdfBuffer = await StorageService.generateSamplePdf('Persisted Test Resource', 'TEST-COURSE', 'TSH-TEST-TOKEN');

    const upload = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('courseId', ids.course)
      .field('title', 'Persisted Test Resource')
      .field('category', 'LECTURE_NOTE')
      .field('academicYear', '2026/2027')
      .attach('file', validPdfBuffer, { filename: `stage3b-${suffix}.pdf`, contentType: 'application/pdf' });
    assert.equal(upload.status, 201);
    ids.document = upload.body.data.id;
    const token = upload.body.data.verificationToken;
    const visitorUpload = await request(app).post('/api/v1/documents').send({});
    assert.equal(visitorUpload.status, 401);
    const approval = await request(app)
      .post(`/api/v1/documents/${ids.document}/review`)
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({ decision: 'APPROVED' });
    assert.equal(approval.status, 200);
    assert.equal(approval.body.data.status, 'APPROVED');

    const resourceList = await request(app).get('/api/v1/documents');
    assert.equal(resourceList.status, 200);
    assert.ok(resourceList.body.data.some((item: { id: string }) => item.id === ids.document));
    const visitorDocument = await request(app).get(`/api/v1/documents/${ids.document}`);
    assert.equal(visitorDocument.status, 200);
    assert.equal(visitorDocument.body.data.verificationToken, undefined);
    assert.equal(visitorDocument.body.data.verification, undefined);
    assert.equal(visitorDocument.body.data.internalFilePath, undefined);
    assert.equal(visitorDocument.body.data.fileHash, undefined);
    const courseMaterials = await request(app).get(`/api/v1/courses/${ids.course}/materials`);
    assert.equal(courseMaterials.status, 200);
    assert.ok(courseMaterials.body.data.materials.every((item: { status: string; accessLevel: string; verificationToken?: string }) =>
      item.status === 'APPROVED' && item.accessLevel === 'PUBLIC' && item.verificationToken === undefined
    ));
    const visitorView = await request(app).get(`/api/v1/documents/${ids.document}/view`);
    const visitorDownload = await request(app).get(`/api/v1/documents/${ids.document}/download`);
    const visitorReport = await request(app).post(`/api/v1/documents/${ids.document}/report`).send({ reasonCategory: 'INACCURATE', details: 'Visitor report attempt.' });
    assert.equal(visitorView.status, 401);
    assert.equal(visitorDownload.status, 401);
    assert.ok(visitorReport.status === 401 || visitorReport.status === 404, 'Expected 401 or 404');
    // Verification is intentionally public for QR code scanning
    const visitorVerification = await request(app).get(`/api/v1/verify/${token}`);
    assert.equal(visitorVerification.status, 200);
    assert.equal(visitorVerification.body.data.isAuthentic, true);
    const verification = await request(app)
      .get(`/api/v1/verify/${token}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(verification.status, 200);
    assert.equal(verification.body.data.isAuthentic, true);

    const revoke = await request(app)
      .post(`/api/v1/verify/${token}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Integration test revocation.' });
    assert.equal(revoke.status, 200);
    const revoked = await request(app)
      .get(`/api/v1/verify/${token}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(revoked.body.data.status, 'REVOKED');

    const quizResponse = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseId: ids.course,
        title: 'Stage 3B Persistent Quiz',
        questions: [{ questionText: '2 + 2?', choices: [{ text: '4', isCorrect: true }, { text: '5', isCorrect: false }] }]
      });
    assert.equal(quizResponse.status, 201);
    ids.quiz = quizResponse.body.data.id;
    const visitorQuizList = await request(app).get('/api/v1/quizzes');
    const visitorQuizDetails = await request(app).get(`/api/v1/quizzes/${ids.quiz}`);
    const visitorQuizSubmit = await request(app).post(`/api/v1/quizzes/${ids.quiz}/submit`).send({ versionId: 'missing', answers: {} });
    assert.equal(visitorQuizList.status, 200);
    assert.equal(visitorQuizDetails.status, 401);
    assert.equal(visitorQuizSubmit.status, 401);
    const version = await pool.query('SELECT id FROM quiz_versions WHERE quiz_id = $1 AND version_number = 1', [ids.quiz]);
    const questionId = (await pool.query<{ questions: Array<{ id: string; choices: Array<{ id: string; isCorrect: boolean }> }> }>(
      'SELECT questions FROM quiz_versions WHERE id = $1', [version.rows[0].id]
    )).rows[0].questions[0];
    const submit = await request(app)
      .post(`/api/v1/quizzes/${ids.quiz}/submit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ versionId: version.rows[0].id, answers: { [questionId.id]: [questionId.choices.find(choice => choice.isCorrect)!.id] }, scorePercentage: 0 });
    assert.equal(submit.status, 200);
    assert.equal(submit.body.data.attempt.scorePercentage, 100);
    ids.attempt = submit.body.data.attempt.id;
    assert.equal((await request(app).get('/api/v1/quizzes/attempts/me')).status, 401);
    assert.equal((await request(app).get(`/api/v1/quizzes/attempts/${ids.attempt}`)).status, 401);
    const visitorAttemptHistory = await request(app).get('/api/v1/quizzes/attempts/me');
    const visitorAttemptDetails = await request(app).get(`/api/v1/quizzes/attempts/${ids.attempt}`);
    assert.equal(visitorAttemptHistory.status, 401);
    assert.equal(visitorAttemptDetails.status, 401);

    const visitorFeedback = await request(app).post('/api/v1/feedback').send({
      category: 'BUG', title: 'Visitor feedback attempt', description: 'Must be rejected.'
    });
    assert.equal(visitorFeedback.status, 401);
    const feedbackResponse = await request(app).post('/api/v1/feedback').set('Authorization', `Bearer ${adminToken}`).send({
      category: 'BUG', title: 'Stage 3B persistence feedback', description: 'Integration fixture'
    });
    assert.equal(feedbackResponse.status, 201);
    ids.feedback = feedbackResponse.body.data.id;
    const feedbackList = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(feedbackList.status, 200);
    assert.ok(feedbackList.body.data.some((item: { id: string }) => item.id === ids.feedback));

    const childScript = `
      (async () => {
        const express = (await import('express')).default;
        const { authenticate } = await import('./src/server/auth.ts');
        const { pgClient } = await import('./src/server/db/pgClient.ts');
        const authRouter = (await import('./src/server/routes/auth.ts')).default;
        const academicRouter = (await import('./src/server/routes/pgAcademic.ts')).default;
        const verifyRouter = (await import('./src/server/routes/pgVerify.ts')).default;
        const quizzesRouter = (await import('./src/server/routes/pgQuizzes.ts')).default;
        const feedbackRouter = (await import('./src/server/routes/pgFeedback.ts')).default;
        const ids = JSON.parse(process.env.PG_PERSISTENCE_IDS);
        const app = express();
        app.use(express.json());
        app.use(authenticate);
        app.use('/api/v1/auth', authRouter);
        app.use('/api/v1', academicRouter);
        app.use('/api/v1/verify', verifyRouter);
        app.use('/api/v1/quizzes', quizzesRouter);
        app.use('/api/v1/feedback', feedbackRouter);
        const server = app.listen(0, '127.0.0.1', async () => {
          try {
            const port = server.address().port;
            const [course, pendingProfile, verification, attempts, feedback] = await Promise.all([
              fetch('http://127.0.0.1:' + port + '/api/v1/courses/' + ids.course),
              fetch('http://127.0.0.1:' + port + '/api/v1/auth/me', { headers: { Authorization: 'Bearer ' + process.env.PG_PERSISTENCE_USER_TOKEN } }),
              fetch('http://127.0.0.1:' + port + '/api/v1/verify/' + process.env.PG_PERSISTENCE_TOKEN, { headers: { Authorization: 'Bearer ' + process.env.PG_PERSISTENCE_ADMIN_TOKEN } }),
              fetch('http://127.0.0.1:' + port + '/api/v1/quizzes/attempts/me', { headers: { Authorization: 'Bearer ' + process.env.PG_PERSISTENCE_ADMIN_TOKEN } }),
              fetch('http://127.0.0.1:' + port + '/api/v1/feedback', { headers: { Authorization: 'Bearer ' + process.env.PG_PERSISTENCE_ADMIN_TOKEN } })
            ]);
            const courseBody = await course.json();
            const profileBody = await pendingProfile.json();
            const verificationBody = await verification.json();
            const attemptsBody = await attempts.json();
            const feedbackBody = await feedback.json();
            const persisted = course.status === 200 && courseBody.data.id === ids.course &&
              pendingProfile.status === 403 && profileBody.error.code === 'ACCOUNT_INACTIVE' &&
              verification.status === 200 && verificationBody.data.status === 'REVOKED' &&
              attempts.status === 200 && attemptsBody.data.some(item => item.id === ids.attempt) &&
              feedback.status === 200 && feedbackBody.data.some(item => item.id === ids.feedback);
            if (persisted) console.log('PERSISTENCE_OK');
            else process.exitCode = 1;
          } catch { process.exitCode = 1; }
          finally {
            await pgClient.close();
            server.close();
          }
        });
      })();
    `;
    const restartedBackend = spawnSync(process.execPath, ['-e', childScript], {
      cwd: process.cwd(),
      env: { ...process.env, PG_PERSISTENCE_IDS: JSON.stringify(ids), PG_PERSISTENCE_TOKEN: token,
        PG_PERSISTENCE_USER_TOKEN: registration.body.data.token, PG_PERSISTENCE_ADMIN_TOKEN: adminToken },
      encoding: 'utf8',
      windowsHide: true
    });
    assert.equal(restartedBackend.status, 0, 'a fresh backend process must serve previously persisted records');
    assert.equal(restartedBackend.stdout.trim(), 'PERSISTENCE_OK');
  } finally {
    await pool.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [ids.quiz || '00000000-0000-0000-0000-000000000000']);
    if (ids.quiz) {
      await pool.query('DELETE FROM quiz_versions WHERE quiz_id = $1', [ids.quiz]);
      await pool.query('DELETE FROM quizzes WHERE id = $1', [ids.quiz]);
    }
    const uploadedFile = await pool.query<{ internal_file_path: string }>(
      'SELECT internal_file_path FROM documents WHERE id = $1', [ids.document]
    );
    await pool.query('DELETE FROM documents WHERE id = $1', [ids.document]);
    if (uploadedFile.rows[0]?.internal_file_path) {
      await unlink(path.join(process.cwd(), 'uploads', 'documents', uploadedFile.rows[0].internal_file_path)).catch(() => undefined);
    }
    if (ids.feedback) await pool.query('DELETE FROM feedback WHERE id = $1', [ids.feedback]);
    if (ids.course) await pool.query('DELETE FROM courses WHERE id = $1', [ids.course]);
    if (ids.department) await pool.query('DELETE FROM departments WHERE id = $1', [ids.department]);
    if (ids.college) await pool.query('DELETE FROM colleges WHERE id = $1', [ids.college]);
    if (ids.registeredUser) await pool.query('DELETE FROM users WHERE id = $1', [ids.registeredUser]);
    await pool.query('DELETE FROM users WHERE id = $1', [ids.lecturer]);
    await pool.query('DELETE FROM users WHERE id = $1', [ids.admin]);
    await pool.end();
    if (previousIntegrationFlag === undefined) delete process.env.PG_INTEGRATION_TESTS;
    else process.env.PG_INTEGRATION_TESTS = previousIntegrationFlag;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
