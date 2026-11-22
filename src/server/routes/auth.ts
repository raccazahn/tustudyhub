import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '../lib/email.ts';
import crypto from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';
import type { UserRole, UserStatus } from '../../types/index.ts';
import { AuthRequest, AuthService, requireAuth, requireRole } from '../auth.ts';
import { validatePassword } from '../../lib/passwordValidator.ts';
import { CURRENT_RECOMMENDED_ITERATIONS, db, DbUserRecord } from '../db.ts';
import { pgClient } from '../db/pgClient.ts';
import { findPgUserByEmail, findPgUserById, insertPgAudit } from '../db/pgRecords.ts';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, fullName, departmentId, requestedRole } = req.body;

  if (!email || !password || !fullName) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email, password, and full name are required.' } });
    return;
  }

  const usePostgres = pgClient.isPostgresEnabled();
  const existing = usePostgres ? await findPgUserByEmail(email) : Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this institutional email already exists.' } });
    return;
  }

  if (requestedRole === 'ADMINISTRATOR') {
    res.status(403).json({ success: false, error: { code: 'ADMIN_REGISTRATION_FORBIDDEN', message: 'Security Violation: Administrator accounts cannot be publicly registered.' } });
    return;
  }

  const role: UserRole = requestedRole === 'LECTURER' ? 'LECTURER' : requestedRole === 'MODERATOR' ? 'MODERATOR' : 'STUDENT';
  const status: UserStatus = (role === 'LECTURER' || role === 'MODERATOR') ? 'PENDING_APPROVAL' : 'ACTIVE';

  const { hash, salt, iterations, algorithm } = await db.hashPassword(password, undefined, CURRENT_RECOMMENDED_ITERATIONS);
  const dept = departmentId ? (usePostgres ? (await pgClient.query<{ id: string; name: string }>('SELECT id, name FROM departments WHERE id = $1', [departmentId])).rows[0] : db.departments.get(departmentId)) : undefined;

  const newUser: DbUserRecord = {
    id: crypto.randomUUID(), email: email.trim().toLowerCase(), fullName: fullName.trim(), role, status, requestedRole: role,
    departmentId: dept?.id, departmentName: dept?.name,
    contributorBio: req.body.contributorBio || (requestedRole === 'LECTURER' ? 'Lecturer contributor application pending administrator review.' : requestedRole === 'MODERATOR' ? 'Moderator contributor application pending administrator review.' : undefined),
    createdAt: new Date().toISOString(), passwordHash: hash, salt, iterations, algorithm
  };

  if (usePostgres) {
    try {
      await pgClient.transaction(async client => {
        await client.query(`INSERT INTO users (id, email, password_hash, salt, iterations, algorithm, full_name, role, status, requested_role, department_id, contributor_bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [newUser.id, newUser.email, hash, salt, iterations, algorithm, newUser.fullName, role, status, role, dept?.id ?? null, newUser.contributorBio ?? null]);
        await insertPgAudit(client, { id: newUser.id, name: newUser.fullName, role: newUser.role }, status === 'PENDING_APPROVAL' ? 'USER_REGISTRATION_REQUESTED' : 'USER_REGISTERED', 'USER', newUser.id, { email: newUser.email, role: newUser.role, status: newUser.status, requestedRole: role }, req.ip);
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this institutional email already exists.' } });
        return;
      }
      res.status(500).json({ success: false, error: { code: 'REGISTRATION_FAILED', message: 'Unable to create the account.' } });
      return;
    }
  } else {
    db.users.set(newUser.id, newUser);
    db.logAudit({ id: newUser.id, name: newUser.fullName, role: newUser.role }, status === 'PENDING_APPROVAL' ? 'USER_REGISTRATION_REQUESTED' : 'USER_REGISTERED', 'USER', newUser.id, { email: newUser.email, role: newUser.role, status: newUser.status, requestedRole: role }, req.ip);
  }

  const token = AuthService.createToken(newUser);
  res.status(201).json({ success: true, data: { user: db.sanitizeUser(newUser), token, status: newUser.status, message: status === 'PENDING_APPROVAL' ? `${role} application submitted successfully. Your account is pending administrator review.` : 'Account created successfully. You can now log in.' } });
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required.' } });

    const normalizedEmail = email.trim().toLowerCase();
    const usePostgres = pgClient.isPostgresEnabled();
    let user: any;

    if (usePostgres) {
      const userRes = await pgClient.query('SELECT id, email, password_hash, full_name, role, status, must_change_password, salt, iterations, algorithm FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (!userRes.rowCount) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      user = userRes.rows[0];
    } else {
      user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    }

    if (user.status !== 'ACTIVE') return res.status(403).json({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: `Your account is currently ${user.status}. Please contact the administrator.` } });

    const pwdHash = user.password_hash || user.passwordHash;
    const salt = user.salt || '';
    const iterations = user.iterations || 10000;
    let algorithm = user.algorithm || 'sha512';
    if (algorithm.includes('-')) algorithm = algorithm.split('-').pop() || 'sha512';

    let isValidPassword = false;
    if (pwdHash && (pwdHash.startsWith('$2a$') || pwdHash.startsWith('$2b$'))) {
      isValidPassword = await bcrypt.compare(password, pwdHash);
    } else {
      try {
        const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, algorithm).toString('hex');
        isValidPassword = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(pwdHash, 'hex'));
      } catch (e) { isValidPassword = false; }
    }

    if (!isValidPassword) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });

    const token = AuthService.createToken(user);
    return res.json({ success: true, data: { token, user: { id: user.id, email: user.email, fullName: user.full_name || user.fullName, role: user.role, status: user.status, mustChangePassword: user.must_change_password } } });
  } catch (error: any) {
    console.error('🔥 LOGIN ERROR:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error during login.' } });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } }); return; }
  const user = pgClient.isPostgresEnabled() ? await findPgUserById(req.user.id) : db.users.get(req.user.id);
  if (!user) { res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } }); return; }
  res.json({ success: true, data: db.sanitizeUser(user) });
});

router.post('/apply-contributor', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const { departmentId, bio } = req.body;
  const usePostgres = pgClient.isPostgresEnabled();
  const user = usePostgres ? await findPgUserById(req.user.id) : db.users.get(req.user.id);
  if (!user) { res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } }); return; }

  user.status = 'PENDING_APPROVAL';
  user.contributorBio = bio || 'Lecturer verification applicant.';
  if (departmentId) {
    const dept = usePostgres ? (await pgClient.query<{ id: string; name: string }>('SELECT id, name FROM departments WHERE id = $1', [departmentId])).rows[0] : db.departments.get(departmentId);
    if (dept) { user.departmentId = dept.id; user.departmentName = dept.name; }
  }

  if (usePostgres) {
    await pgClient.transaction(async client => {
      await client.query('UPDATE users SET status = $1, contributor_bio = $2, department_id = $3, updated_at = NOW() WHERE id = $4', [user.status, user.contributorBio, user.departmentId ?? null, user.id]);
      await insertPgAudit(client, { id: user.id, name: user.fullName, role: user.role }, 'CONTRIBUTOR_APPLICATION_SUBMITTED', 'USER', user.id, { departmentId }, req.ip);
    });
  } else {
    db.logAudit({ id: user.id, name: user.fullName, role: user.role }, 'CONTRIBUTOR_APPLICATION_SUBMITTED', 'USER', user.id, { departmentId }, req.ip);
  }
  res.json({ success: true, data: { message: 'Contributor application submitted.', status: user.status } });
});

router.post('/demo-switch', async (req: AuthRequest, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }); return; }
  if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in before using development role tools.' } }); return; }
  if (req.user.role !== 'ADMINISTRATOR') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } }); return; }

  const { role } = req.body as { role: UserRole };
  const demoEmails: Partial<Record<UserRole, string>> = { ADMINISTRATOR: 'admin@tustudyhub.edu', MODERATOR: 'moderator@tustudyhub.edu', LECTURER: 'lecturer.cs@tustudyhub.edu', STUDENT: 'student@tustudyhub.edu' };

  let targetUser: any;
  if (pgClient.isPostgresEnabled() && demoEmails[role]) targetUser = await findPgUserByEmail(demoEmails[role]!);
  else if (role === 'ADMINISTRATOR') targetUser = db.users.get('user-admin-01');
  else if (role === 'MODERATOR') targetUser = db.users.get('user-mod-01');
  else if (role === 'LECTURER') targetUser = db.users.get('user-lec-cs-01');
  else if (role === 'STUDENT') targetUser = db.users.get('user-stud-01');

  if (!targetUser) { res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Demo user not found.' } }); return; }

  res.json({ success: true, data: { user: db.sanitizeUser(targetUser), token: AuthService.createToken(targetUser), role: targetUser.role } });
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email is required.' } }); return; }
    const normalizedEmail = email.trim().toLowerCase();
    const usePostgres = pgClient.isPostgresEnabled();
    let user: any;

    if (usePostgres) {
      const userRes = await pgClient.query('SELECT id, email, full_name, status FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (!userRes.rowCount || userRes.rows[0].status !== 'ACTIVE') { res.json({ success: true, message: 'If an account exists, a reset link has been sent.' }); return; }
      user = userRes.rows[0];
    } else {
      user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user || user.status !== 'ACTIVE') { res.json({ success: true, message: 'If an account exists, a reset link has been sent.' }); return; }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    if (usePostgres) await pgClient.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, token, expiresAt]);
    else { if (!(db as any).passwordResetTokens) (db as any).passwordResetTokens = new Map(); (db as any).passwordResetTokens.set(token, { userId: user.id, expiresAt }); }

    try { await sendPasswordResetEmail(email, user.full_name || user.fullName || 'Valued User', token); } catch (e) { console.error('⚠️ [EMAIL] Failed:', e); }
    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) { res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Token and new password are required.' } }); return; }
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) { res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: passwordValidation.errors.join(', ') } }); return; }

    const usePostgres = pgClient.isPostgresEnabled();
    let userId: string | undefined;
    if (usePostgres) {
      const tokenRes = await pgClient.query('SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1', [token]);
      if (!tokenRes.rowCount || new Date(tokenRes.rows[0].expires_at) < new Date()) { res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' } }); return; }
      userId = tokenRes.rows[0].user_id;
    } else {
      const resetData = (db as any).passwordResetTokens?.get(token);
      if (!resetData || new Date(resetData.expiresAt) < new Date()) { res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' } }); return; }
      userId = resetData.userId;
    }

    const hashResult = await db.hashPassword(newPassword);
    if (usePostgres) {
      await pgClient.query(`UPDATE users SET password_hash = $1, salt = $2, iterations = $3, algorithm = $4, must_change_password = FALSE WHERE id = $5`, [hashResult.hash, hashResult.salt, hashResult.iterations, hashResult.algorithm, userId]);
      await pgClient.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
    } else {
      const user = db.users.get(userId!);
      if (user) { user.passwordHash = hashResult.hash; user.salt = hashResult.salt; user.iterations = hashResult.iterations; user.algorithm = hashResult.algorithm; (user as any).must_change_password = false; db.users.set(userId!, user); }
      (db as any).passwordResetTokens?.delete(token);
    }
    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) { next(error); }
});

export default router;
