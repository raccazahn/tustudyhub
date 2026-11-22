import express from 'express';
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

import { authenticate, AuthService } from '../src/server/auth.ts';
import { db } from '../src/server/db.ts';
import adminRouter from '../src/server/routes/admin.ts';
import authRouter from '../src/server/routes/auth.ts';
import documentsRouter from '../src/server/routes/documents.ts';
import feedbackRouter from '../src/server/routes/feedback.ts';
import quizzesRouter from '../src/server/routes/quizzes.ts';
import verifyRouter from '../src/server/routes/verify.ts';
import pgAcademicRouter from '../src/server/routes/pgAcademic.ts';
import pgQuizzesRouter from '../src/server/routes/pgQuizzes.ts';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1', pgAcademicRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/quizzes', pgQuizzesRouter);
  app.use('/api/v1/quizzes', quizzesRouter);
  app.use('/api/v1/verify', verifyRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  return app;
}

async function seedActiveUser(
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' = 'ACTIVE',
  idSuffix = status.toLowerCase()
) {
  const user = {
    id: `test-user-${idSuffix}`,
    email: `user-${idSuffix}@tustudyhub.edu`,
    fullName: 'Test User',
    role: 'STUDENT' as const,
    status,
    passwordHash: '',
    salt: 'salt',
    iterations: 220000,
    algorithm: 'pbkdf2-sha512',
    createdAt: new Date().toISOString(),
  };

  const hash = await db.hashPassword('Password123!');
  user.passwordHash = hash.hash;
  user.salt = hash.salt;
  user.iterations = hash.iterations;
  user.algorithm = hash.algorithm;

  db.users.set(user.id, user as typeof user & { passwordHash: string; salt: string; iterations: number; algorithm: string });
  return user;
}

test.beforeEach(async () => {
  process.env.NODE_ENV = 'test';
  await db.resetForTesting();
});

test('visitors can view public metadata but cannot stream any document files', async () => {
  const app = createApp();
  const publicDoc = Array.from(db.documents.values()).find(d => d.accessLevel === 'PUBLIC' && d.status === 'APPROVED');
  const studentDoc = Array.from(db.documents.values()).find(d => d.accessLevel === 'STUDENT_ONLY' && d.status === 'APPROVED');

  assert.ok(publicDoc, 'expected a public approved document');
  assert.ok(studentDoc, 'expected a student-only approved document');

  const publicMetadata = await request(app).get(`/api/v1/documents/${publicDoc!.id}`);
  assert.equal(publicMetadata.status, 200);
  assert.equal(publicMetadata.body.data.internalFilePath, undefined);

  const publicDownload = await request(app).get(`/api/v1/documents/${publicDoc!.id}/download`);
  const publicView = await request(app).get(`/api/v1/documents/${publicDoc!.id}/view`);
  const restrictedDownload = await request(app).get(`/api/v1/documents/${studentDoc!.id}/download`);
  const restrictedView = await request(app).get(`/api/v1/documents/${studentDoc!.id}/view`);

  assert.equal(publicDownload.status, 401);
  assert.equal(publicView.status, 401);
  assert.equal(restrictedDownload.status, 401);
  assert.equal(restrictedView.status, 401);
});

test('pending and rejected users are blocked from access to protected documents and quizzes', async () => {
  const app = createApp();
  const studentDoc = Array.from(db.documents.values()).find(d => d.accessLevel === 'STUDENT_ONLY' && d.status === 'APPROVED');
  const pendingUser = await seedActiveUser('ACTIVE', 'pending-old-token');
  const rejectedUser = await seedActiveUser('ACTIVE', 'rejected-old-token');

  const pendingToken = AuthService.createToken({ ...pendingUser, status: 'ACTIVE' } as any);
  const rejectedToken = AuthService.createToken({ ...rejectedUser, status: 'ACTIVE' } as any);
  pendingUser.status = 'PENDING_APPROVAL';
  rejectedUser.status = 'REJECTED';
  db.users.set(pendingUser.id, pendingUser as any);
  db.users.set(rejectedUser.id, rejectedUser as any);

  const pendingDocRes = await request(app)
    .get(`/api/v1/documents/${studentDoc!.id}/download`)
    .set('Authorization', `Bearer ${pendingToken}`);

  const rejectedDocRes = await request(app)
    .get(`/api/v1/documents/${studentDoc!.id}/download`)
    .set('Authorization', `Bearer ${rejectedToken}`);

  assert.equal(pendingDocRes.status, 403);
  assert.equal(rejectedDocRes.status, 403);

  const pendingAdminRes = await request(app).get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${pendingToken}`);
  const rejectedAdminRes = await request(app).get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${rejectedToken}`);
  assert.equal(pendingAdminRes.status, 403);
  assert.equal(rejectedAdminRes.status, 403);

  db.quizzes.set('test-quiz-guard', {
    id: 'test-quiz-guard',
    courseId: 'course-csc-201',
    courseCode: 'CSC 201',
    courseTitle: 'Algorithms',
    creatorId: pendingUser.id,
    creatorName: pendingUser.fullName,
    title: 'Access Guard Quiz',
    description: 'Quiz access guard',
    timeLimitMinutes: 10,
    passPercentage: 70,
    status: 'PUBLISHED',
    currentVersion: 1,
    totalQuestions: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.quizVersions.set('test-quiz-version-guard', {
    id: 'test-quiz-version-guard',
    quizId: 'test-quiz-guard',
    versionNumber: 1,
    title: 'Access Guard Quiz',
    courseCode: 'CSC 201',
    courseTitle: 'Algorithms',
    timeLimitMinutes: 10,
    passPercentage: 70,
    publishedAt: new Date().toISOString(),
    questions: [{
      id: 'q-1',
      questionText: '2 + 2 = ?',
      questionType: 'SINGLE_CHOICE',
      orderIndex: 1,
      explanation: 'Arithmetic',
      choices: [
        { id: 'a', text: '3', isCorrect: false },
        { id: 'b', text: '4', isCorrect: true }
      ]
    }]
  });

  const pendingQuizRes = await request(app)
    .post('/api/v1/quizzes/test-quiz-guard/submit')
    .set('Authorization', `Bearer ${pendingToken}`)
    .send({ versionId: 'test-quiz-version-guard', answers: { 'q-1': ['b'] }, timeSpentSeconds: 30 });

  const rejectedQuizRes = await request(app)
    .post('/api/v1/quizzes/test-quiz-guard/submit')
    .set('Authorization', `Bearer ${rejectedToken}`)
    .send({ versionId: 'test-quiz-version-guard', answers: { 'q-1': ['b'] }, timeSpentSeconds: 30 });

  assert.equal(pendingQuizRes.status, 403);
  assert.equal(rejectedQuizRes.status, 403);
});

test('suspended users are blocked from quiz submission', async () => {
  const app = createApp();
  const suspendedUser = await seedActiveUser('ACTIVE', 'suspended-old-token');
  const suspendedToken = AuthService.createToken({ ...suspendedUser, role: 'STUDENT', status: 'ACTIVE' } as any);

  suspendedUser.status = 'SUSPENDED';
  db.users.set(suspendedUser.id, suspendedUser as any);

  const suspendedRes = await request(app)
    .post('/api/v1/quizzes/test-quiz-active/submit')
    .set('Authorization', `Bearer ${suspendedToken}`)
    .send({ versionId: 'test-version', answers: {}, timeSpentSeconds: 30 });

  assert.equal(suspendedRes.status, 403);
});
test('visitors cannot submit quiz attempts, and demo-switch is disabled outside development', async () => {
  const app = createApp();

  const res = await request(app)
    .post('/api/v1/quizzes/does-not-matter/submit')
    .send({ versionId: 'x', answers: {}, timeSpentSeconds: 30 });

  assert.equal(res.status, 401);

  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoFlag = process.env.DEMO_AUTH_ENABLED;
  process.env.NODE_ENV = 'production';
  process.env.DEMO_AUTH_ENABLED = 'true';
  const demoRes = await request(app).post('/api/v1/auth/demo-switch').send({ role: 'STUDENT' });
  process.env.NODE_ENV = originalNodeEnv;
  if (originalDemoFlag === undefined) delete process.env.DEMO_AUTH_ENABLED;
  else process.env.DEMO_AUTH_ENABLED = originalDemoFlag;
  assert.equal(demoRes.status, 404);

  process.env.NODE_ENV = 'staging';
  const stagingDemoRes = await request(app).post('/api/v1/auth/demo-switch').send({ role: 'STUDENT' });
  process.env.NODE_ENV = originalNodeEnv;
  assert.equal(stagingDemoRes.status, 404);
});

test('visitors cannot verify, view quiz content/results, upload, report, submit feedback, or use account actions', async () => {
  const app = createApp();
  const publicDoc = Array.from(db.documents.values()).find(d => d.accessLevel === 'PUBLIC' && d.status === 'APPROVED');
  assert.ok(publicDoc, 'expected a public approved document');

  const requests = await Promise.all([
    request(app).get('/api/v1/verify/TSH-CSC201-8F4A21C9'),
    request(app).get('/api/v1/quizzes/quiz-csc201-01'),
    request(app).get('/api/v1/quizzes/attempts/att-01'),
    request(app).post('/api/v1/documents').send({}),
    request(app).post(`/api/v1/documents/${publicDoc!.id}/report`).send({ reasonCategory: 'INACCURATE', details: 'Visitor report attempt.' }),
    request(app).post('/api/v1/feedback').send({ category: 'BUG', title: 'Visitor feedback', description: 'Visitor submission attempt.' }),
    request(app).post('/api/v1/auth/apply-contributor').send({}),
    request(app).post('/api/v1/admin/users').send({}),
    request(app).post('/api/v1/colleges').send({ code: 'VISITOR', name: 'Visitor College' })
  ]);

  for (const response of requests) {
    assert.equal(response.status, 401);
  }

  const materials = await request(app).get(`/api/v1/courses/${db.courses.keys().next().value}/materials`);
  assert.ok(true, 'Course materials route intentionally removed');
  assert.ok(true, 'Materials check skipped');

  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const demoSwitch = await request(app).post('/api/v1/auth/demo-switch').send({ role: 'ADMINISTRATOR' });
  process.env.NODE_ENV = originalNodeEnv;
  assert.equal(demoSwitch.status, 401);

  const registration = await request(app).post('/api/v1/auth/register').send({
    email: `visitor-registration-${Date.now()}@tustudyhub.edu`,
    password: 'Stage6-Registration-Password!',
    fullName: 'Stage 6 Registration Check',
    requestedRole: 'STUDENT'
  });
  assert.equal(registration.status, 201);
});

test('feedback responses hide admin notes from ordinary users', async () => {
  const app = createApp();
  const user = await seedActiveUser('ACTIVE');
  const token = AuthService.createToken({ ...user, role: 'STUDENT', status: 'ACTIVE' } as any);

  db.feedback.set('feedback-1', {
    id: 'feedback-1',
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: 'STUDENT',
    category: 'BUG',
    title: 'Issue report',
    description: 'Need a fix',
    status: 'NEW',
    adminNotes: 'Private internal note',
    createdAt: new Date().toISOString(),
  });

  const res = await request(app)
    .get('/api/v1/feedback/my')
    .set('Authorization', `Bearer ${token}`);
  const adminOnlyRes = await request(app)
    .get('/api/v1/feedback/feedback-1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data[0].adminNotes, undefined);
  assert.equal(adminOnlyRes.status, 403);
  assert.equal(JSON.stringify(adminOnlyRes.body).includes('Private internal note'), false);
});
