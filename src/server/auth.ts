import jwt from 'jsonwebtoken';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Authentication & Role Authorization Middleware
 * Enforces server-side RBAC, status checks, and token signing.
 */

import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import type { User, UserRole } from '../types/index.ts';
import { db } from './db.ts';
import { pgClient } from './db/pgClient.ts';
import { findPgUserById } from './db/pgRecords.ts';

// Development fallback secret (isolated strictly to development environments)
const DEV_FALLBACK_SECRET = 'tustudyhub_academic_secret_2026_dev_key';

// Common default or easily guessable secrets that are banned in production
const KNOWN_INSECURE_SECRETS = new Set([
  'tustudyhub_academic_secret_2026_dev_key',
  'secret',
  'jwt_secret',
  'changeme',
  '1234567890',
  'password',
  'default_secret',
  'admin'
]);

let cachedValidatedSecret: string | null = null;

/**
 * Validates the JWT_SECRET configuration.
 * - In production: Refuses startup if missing, shorter than 32 characters, or a known dev secret.
 * - In development: Uses an explicit dev fallback and logs a security notice.
 * Never logs the actual secret.
 */
export function validateJwtSecret(): string {
  if (cachedValidatedSecret) {
    return cachedValidatedSecret;
  }

  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length === 0) {
      console.error('[FATAL SECURITY ERROR] JWT_SECRET environment variable is missing. Production startup aborted.');
      process.exit(1);
    }
    if (secret.length < 32) {
      console.error('[FATAL SECURITY ERROR] JWT_SECRET must be at least 32 characters long. Production startup aborted.');
      process.exit(1);
    }
    if (KNOWN_INSECURE_SECRETS.has(secret.toLowerCase())) {
      console.error('[FATAL SECURITY ERROR] JWT_SECRET cannot be set to a known development or default secret. Production startup aborted.');
      process.exit(1);
    }
    cachedValidatedSecret = secret;
    return secret;
  }

  // Development environment
  if (!secret) {
    console.warn('[SECURITY NOTICE] Running in development mode with temporary development secret. Set a secure JWT_SECRET in .env for production.');
    cachedValidatedSecret = DEV_FALLBACK_SECRET;
    return DEV_FALLBACK_SECRET;
  }

  cachedValidatedSecret = secret;
  return secret;
}

export function getJwtSecret(): string {
  return validateJwtSecret();
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
  departmentId?: string;
  departmentName?: string;
  assignedCourseCodes?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export class AuthService {
  public static createToken(user: User): string {
    return jwt.sign({ id: user.id, email: user.email, role: user.role, status: user.status }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' });
  }
  public static verifyToken(token: string): { valid: boolean; payload?: any } {
    try {
      const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any;
      if (!payload || typeof payload.id !== 'string' || payload.id.trim() === '') return { valid: false };
      return { valid: true, payload };
    } catch { return { valid: false }; }
  }
}

/**
 * Express middleware to authenticate Bearer token
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.path && /^\/api\/v1\/documents\/[^/]+\/(view|download)$/.test(req.path) && req.query && typeof req.query.token === 'string') { token = req.query.token; }

  if (!token) {
    // Visitor (unauthenticated)
    return next();
  }

  const result = AuthService.verifyToken(token);
  if (!result.valid || !result.payload) {
    return next();
  }

  let dbUser;
  try {
    dbUser = pgClient.isPostgresEnabled()
      ? await findPgUserById(result.payload.id)
      : db.users.get(result.payload.id);
  } catch (error) {
    next(error);
    return;
  }
  if (!dbUser) {
    return next();
  }

  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role,
    status: dbUser.status,
    departmentId: dbUser.departmentId,
    departmentName: dbUser.departmentName,
    assignedCourseCodes: dbUser.assignedCourseCodes
  };

  next();
}

/**
 * Guard requiring an authenticated user
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }
  next();
};

/**
 * Guard requiring specific user roles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
      return;
    }

    if (req.user.status === 'PENDING_APPROVAL' || req.user.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is pending approval or has been rejected.' }
      });
      return;
    }

    if (req.user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}.`
        }
      });
      return;
    }

    next();
  };
}

export function requireVerifiedStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  if (req.user.role !== 'STUDENT') return next(); // Only applies to students

  // Authoritative DB check to prevent stale JWT bypass
  pgClient.query('SELECT verification_status FROM student_verifications WHERE user_id = $1 AND verification_status = \'VERIFIED\'', [req.user.id])
    .then(result => {
      if (!result.rowCount) {
        return res.status(403).json({ success: false, error: { code: 'VERIFICATION_REQUIRED', message: 'TU student verification is required to access this feature.' } });
      }
      next();
    })
    .catch(err => {
      console.error('Verification check error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify student status.' } });
    });
}
