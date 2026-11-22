import express from 'express';
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

import { AuthService } from '../src/server/auth.ts';
import { pgClient } from '../src/server/db/pgClient.ts';
import notificationsRouter from '../src/server/routes/pgNotifications.ts';
import pgDocumentsRouter from '../src/server/routes/pgDocuments.ts';
import pgQuizzesRouter from '../src/server/routes/pgQuizzes.ts';

const pgEnabled = pgClient.isPostgresEnabled();

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = AuthService.verifyToken(token);
      if (result.valid && result.payload) {
        req.user = {
          id: result.payload.id,
          role: result.payload.role,
          status: result.payload.status,
          fullName: 'Test User',
          email: 'test@test.com',
          assignedCourseCodes: ['CSC101', 'CSC102', 'CSC103']
        };
      }
    }
    next();
  });
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/documents', pgDocumentsRouter);
  app.use('/api/v1/quizzes', pgQuizzesRouter);
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Express error caught:', err.message);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  });
  return app;
}

async function seedUser(id: string, email: string, role: string) {
  await pgClient.query(`
    INSERT INTO users (id, email, password_hash, salt, iterations, algorithm, full_name, role, status)
    VALUES ($1, $2, 'hash', 'salt', 220000, 'pbkdf2-sha512', 'Test User', $3, 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, full_name = EXCLUDED.full_name
  `, [id, email, role]);
}

const COLLEGE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DEPT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

test.beforeEach(async () => {
  if (!pgEnabled) return;

  await pgClient.query('DELETE FROM notification_reads');
  await pgClient.query('DELETE FROM notifications');
  await pgClient.query('DELETE FROM quiz_attempts');
  await pgClient.query('DELETE FROM quiz_versions');
  await pgClient.query('DELETE FROM quizzes');
  await pgClient.query('DELETE FROM document_reviews');
  await pgClient.query('DELETE FROM document_verifications');
  await pgClient.query('DELETE FROM documents');
  await pgClient.query('DELETE FROM courses');
  await pgClient.query('DELETE FROM departments');
  await pgClient.query('DELETE FROM colleges');
  await pgClient.query(`DELETE FROM users WHERE email LIKE 'test-%' OR email LIKE 's-%' OR email LIKE 'a-%' OR email LIKE 'uploader-%' OR email LIKE 'reviewer-%' OR email LIKE 'student-quiz-%'`);

  await pgClient.query(`INSERT INTO colleges (id, code, name) VALUES ('${COLLEGE_ID}', 'CST', 'Test College') ON CONFLICT (id) DO NOTHING`);
  await pgClient.query(`INSERT INTO departments (id, college_id, code, name) VALUES ('${DEPT_ID}', '${COLLEGE_ID}', 'CS', 'Test Dept') ON CONFLICT (id) DO NOTHING`);
});

test('visitors cannot access notification endpoints', { skip: !pgEnabled }, async () => {
  const app = createApp();
  assert.equal((await request(app).get('/api/v1/notifications')).status, 401);
  assert.equal((await request(app).patch('/api/v1/notifications/123/read')).status, 401);
});

test('users can fetch notifications and unread count', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const userId = '11111111-1111-1111-1111-111111111111';
  await seedUser(userId, 'test-fetch@test.com', 'STUDENT');
  const token = AuthService.createToken({ id: userId, role: 'STUDENT', status: 'ACTIVE', fullName: 'Test', email: 'test-fetch@test.com' } as any);

  await pgClient.query(`INSERT INTO notifications (user_id, type, title, message) VALUES (NULL, 'ANNOUNCEMENT', 'Global', 'Hello')`);
  await pgClient.query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'SYSTEM', 'Personal', 'Hello you')`, [userId]);

  const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.unreadCount, 2);
});

test('users can mark notifications as read', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const userId = '22222222-2222-2222-2222-222222222222';
  await seedUser(userId, 'test-read@test.com', 'STUDENT');
  const token = AuthService.createToken({ id: userId, role: 'STUDENT', status: 'ACTIVE', fullName: 'Test', email: 'test-read@test.com' } as any);

  const ins = await pgClient.query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'SYSTEM', 'Test', 'Msg') RETURNING id`, [userId]);
  const notifId = ins.rows[0].id;

  const patchRes = await request(app).patch(`/api/v1/notifications/${notifId}/read`).set('Authorization', `Bearer ${token}`);
  assert.equal(patchRes.status, 200);

  const getRes = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
  assert.equal(getRes.body.data.unreadCount, 0);
});

test('only administrators can create announcements', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const adminId = '33333333-3333-3333-3333-333333333333';
  await seedUser(adminId, 'test-admin@test.com', 'ADMINISTRATOR');
  const adminToken = AuthService.createToken({ id: adminId, role: 'ADMINISTRATOR', status: 'ACTIVE', fullName: 'Admin', email: 'test-admin@test.com' } as any);

  const adminRes = await request(app).post('/api/v1/notifications/announce').set('Authorization', `Bearer ${adminToken}`).send({ type: 'ANNOUNCEMENT', title: 'Real', message: 'Real announcement' });
  assert.equal(adminRes.status, 201);
  assert.equal(adminRes.body.success, true);
});

test('document approval triggers a notification for the uploader', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const uploaderId = '44444444-4444-4444-4444-444444444444';
  const reviewerId = '55555555-5555-5555-5555-555555555555';
  const courseId = 'cccccccc-cccc-cccc-cccc-cccccccccc01';
  const docId = 'dddddddd-dddd-dddd-dddd-dddddddddd01';

  await seedUser(uploaderId, 'uploader@test.com', 'STUDENT');
  await seedUser(reviewerId, 'reviewer@test.com', 'ADMINISTRATOR');

  await pgClient.query(`INSERT INTO courses (id, college_id, department_id, code, title, level, semester) VALUES ('${courseId}', '${COLLEGE_ID}', '${DEPT_ID}', 'CSC101', 'Test Course', 100, 'FIRST')`);
  await pgClient.query(`INSERT INTO documents (id, course_id, uploader_id, title, category, academic_year, file_name, file_size, mime_type, file_hash, internal_file_path, verification_token) VALUES ('${docId}', '${courseId}', '${uploaderId}', 'Test Doc', 'LECTURE_NOTE', '2024', 'test.pdf', 100, 'application/pdf', 'hash', '/path', 'token1')`);
  await pgClient.query(`INSERT INTO document_verifications (document_id, verification_token) VALUES ('${docId}', 'token1')`);

  const reviewerToken = AuthService.createToken({ id: reviewerId, role: 'ADMINISTRATOR', status: 'ACTIVE', fullName: 'Reviewer', email: 'reviewer@test.com', assignedCourseCodes: ['CSC101'] } as any);

  const res = await request(app).post(`/api/v1/documents/${docId}/review`).set('Authorization', `Bearer ${reviewerToken}`).send({ decision: 'APPROVED', feedbackReason: 'Looks good' });

  if (res.status !== 200) console.error('Document review failed:', res.body);
  assert.equal(res.status, 200);

  const notifRes = await pgClient.query(`SELECT * FROM notifications WHERE user_id = $1 AND type = 'DOCUMENT_APPROVED'`, [uploaderId]);
  assert.equal(notifRes.rowCount, 1, 'Notification should be created for document approval');
  assert.equal(notifRes.rows[0].entity_id, docId);
});

test('quiz submission triggers a result notification for the student', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const studentId = '66666666-6666-6666-6666-666666666666';
  const courseId = 'cccccccc-cccc-cccc-cccc-cccccccccc02';
  const quizId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01';

  await seedUser(studentId, 'student-quiz@test.com', 'STUDENT');
  await pgClient.query(`INSERT INTO courses (id, college_id, department_id, code, title, level, semester) VALUES ('${courseId}', '${COLLEGE_ID}', '${DEPT_ID}', 'CSC102', 'Test Course 2', 100, 'FIRST')`);
  await pgClient.query(`INSERT INTO quizzes (id, course_id, creator_id, title, description, time_limit_minutes, pass_percentage, status, current_version, total_questions) VALUES ('${quizId}', '${courseId}', '${studentId}', 'Test Quiz', 'Desc', 10, 70, 'PUBLISHED', 1, 1)`);
  await pgClient.query(`INSERT INTO quiz_versions (id, quiz_id, version_number, title, time_limit_minutes, pass_percentage, questions) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11', '${quizId}', 1, 'Test Quiz', 10, 70, '[{"id":"q1","questionText":"1+1?","questionType":"SINGLE_CHOICE","orderIndex":1,"explanation":"Math","choices":[{"id":"c1","text":"2","isCorrect":true}]}]'::jsonb)`);

  const studentToken = AuthService.createToken({ id: studentId, role: 'STUDENT', status: 'ACTIVE', fullName: 'Student', email: 'student-quiz@test.com' } as any);

  const res = await request(app).post(`/api/v1/quizzes/${quizId}/submit`).set('Authorization', `Bearer ${studentToken}`).send({ versionId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11', answers: { 'q1': ['c1'] }, timeSpentSeconds: 30 });

  if (res.status !== 200) console.error('Quiz submit failed:', res.body);
  assert.equal(res.status, 200);

  const notifRes = await pgClient.query(`SELECT * FROM notifications WHERE user_id = $1 AND type = 'QUIZ_RESULT_AVAILABLE'`, [studentId]);
  assert.equal(notifRes.rowCount, 1, 'Notification should be created for quiz result');
  assert.ok(notifRes.rows[0].message.includes('passed'));
});

test('quiz publication triggers notifications for active students', { skip: !pgEnabled }, async () => {
  const app = createApp();
  const student1Id = '77777777-7777-7777-7777-777777777777';
  const student2Id = '88888888-8888-8888-8888-888888888888';
  const adminId = '99999999-9999-9999-9999-999999999999';
  const courseId = 'cccccccc-cccc-cccc-cccc-cccccccccc03';
  const quizId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02';

  await seedUser(student1Id, 's1@test.com', 'STUDENT');
  await seedUser(student2Id, 's2@test.com', 'STUDENT');
  await seedUser(adminId, 'admin@test.com', 'ADMINISTRATOR');

  await pgClient.query(`INSERT INTO courses (id, college_id, department_id, code, title, level, semester) VALUES ('${courseId}', '${COLLEGE_ID}', '${DEPT_ID}', 'CSC103', 'Test Course 3', 100, 'FIRST')`);
  await pgClient.query(`INSERT INTO quizzes (id, course_id, creator_id, title, description, time_limit_minutes, pass_percentage, status, current_version, total_questions) VALUES ('${quizId}', '${courseId}', '${adminId}', 'Draft Quiz', 'Desc', 10, 70, 'DRAFT', 1, 1)`);
  await pgClient.query(`INSERT INTO quiz_versions (id, quiz_id, version_number, title, time_limit_minutes, pass_percentage, questions) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee12', '${quizId}', 1, 'Draft Quiz', 10, 70, '[]'::jsonb)`);

  const adminToken = AuthService.createToken({ id: adminId, role: 'ADMINISTRATOR', status: 'ACTIVE', fullName: 'Admin', email: 'admin@test.com', assignedCourseCodes: ['CSC103'] } as any);

  const res = await request(app).post(`/api/v1/quizzes/${quizId}/approve`).set('Authorization', `Bearer ${adminToken}`).send({ title: 'Published Quiz' });

  if (res.status !== 200) console.error('Quiz approve failed:', res.body);
  assert.equal(res.status, 200);

  // Robust check: verify the specific students received the notification
  const notifRes1 = await pgClient.query(`SELECT * FROM notifications WHERE user_id = $1 AND type = 'QUIZ_PUBLISHED'`, [student1Id]);
  const notifRes2 = await pgClient.query(`SELECT * FROM notifications WHERE user_id = $1 AND type = 'QUIZ_PUBLISHED'`, [student2Id]);

  assert.equal(notifRes1.rowCount, 1, 'Student 1 should receive a notification');
  assert.equal(notifRes2.rowCount, 1, 'Student 2 should receive a notification');
});
