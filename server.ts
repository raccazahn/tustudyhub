/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Full-Stack Server Entry Point
 * Host: 0.0.0.0, Port: 3000
 * Serves REST API /api/v1/ and mounts Vite middlewares
 */

import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, validateJwtSecret } from './src/server/auth.ts';
import { db } from './src/server/db.ts';
import { pgClient } from './src/server/db/pgClient.ts';
import authRouter from './src/server/routes/auth.ts';
import documentsRouter from './src/server/routes/documents.ts';
import downloadAppRouter from './src/server/routes/downloadApp.ts';
import feedbackRouter from './src/server/routes/feedback.ts';
import pgAcademicRouter from './src/server/routes/pgAcademic.ts';
import pgAdminRouter from './src/server/routes/pgAdmin.ts';
import pgDocumentsRouter from './src/server/routes/pgDocuments.ts';
import pgFeedbackRouter from './src/server/routes/pgFeedback.ts';
import pgQuizzesRouter from './src/server/routes/pgQuizzes.ts';
import pgVerifyRouter from './src/server/routes/pgVerify.ts';
import pgNotificationsRouter from './src/server/routes/pgNotifications.ts';
import notificationsRouter from './src/server/routes/notifications.ts';
import forumRouter from './src/server/routes/forum.ts';
import studentVerificationRouter from './src/server/routes/studentVerification.ts';
import academicStructureRouter from './src/server/routes/academicStructure.ts';
import documentRecommendationsRouter from './src/server/routes/documentRecommendations.ts';
import quizzesRouter from './src/server/routes/quizzes.ts';
import verifyRouter from './src/server/routes/verify.ts';
import quizDocumentExtractionRouter from './src/server/routes/quizDocumentExtraction.ts';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Enforce cryptographic session secret requirements before binding port
  validateJwtSecret();

  // Initialize and seed database asynchronously before accepting traffic
  await db.init();
  if (pgClient.getStatus().isConfigured) {
    const migration = await pgClient.migrate();
    console.info(`PostgreSQL schema migration ${migration.applied ? 'applied' : 'already current'} (${migration.version}).`);
  }

  const app = express();

  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = cliPort || (process.env.NODE_ENV === 'production' && process.env.PORT ? Number(process.env.PORT) : 3000);
  const isProduction = process.env.NODE_ENV === 'production';

  // Body Parsing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Powered-By', 'TuStudyHub Platform');
    next();
  });

  // Global Auth Middleware
  app.use(authenticate);

  // Health check endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    const databaseConnected = await pgClient.checkConnection();
    res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? 'UP' : 'DOWN',
      app: 'TuStudyHub',
      tagline: 'Learn • Share • Verify',
      dependencies: { postgresql: databaseConnected ? 'UP' : 'DOWN' },
      timestamp: new Date().toISOString()
    });
  });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

  // REST API v1 Endpoints (Courses routes completely removed)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', pgAdminRouter);
    app.use('/api/v1/verify', pgVerifyRouter);
  app.use('/api/v1/quizzes', pgQuizzesRouter);
  app.use('/api/v1/feedback', pgFeedbackRouter);
  app.use('/api/v1/documents/recommended', documentRecommendationsRouter);
  app.use('/api/v1/documents', pgDocumentsRouter);
  app.use('/api/v1', pgAcademicRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/verify', verifyRouter);
  app.use('/api/v1/quizzes', quizzesRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/notifications', pgNotificationsRouter);
  app.use('/api/v1/forum', forumRouter);
  app.use('/api/v1/verification', studentVerificationRouter);
  app.use('/api/v1/academic', academicStructureRouter);
    app.use('/api/v1/download', downloadAppRouter);
  app.use('/download/app', downloadAppRouter);
  app.use('/api/v1/quizzes', quizDocumentExtractionRouter);

  // Error handling for API routes
  app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred.'
      }
    });
  });

  // Serve static public assets (PWA manifest, service worker, PNG icons)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Frontend Serving: Vite dev middlewares or static production files
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TuStudyHub full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
