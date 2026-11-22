import type { PoolClient, QueryResultRow } from 'pg';
import type { DbUserRecord } from '../db.ts';
import { pgClient } from './pgClient.ts';

export interface PgUserRow extends QueryResultRow {
  id: string;
  email: string;
  fullName: string;
  role: DbUserRecord['role'];
  status: DbUserRecord['status'];
  requestedRole: DbUserRecord['requestedRole'] | null;
  departmentId: string | null;
  departmentName: string | null;
  contributorBio: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  passwordHash: string;
  salt: string;
  iterations: number;
  algorithm: string;
  assignedCourseCodes: string[];
}

export const PG_USER_SELECT = `
  SELECT u.id, u.email, u.full_name AS "fullName", u.role, u.status,
         u.requested_role AS "requestedRole", u.department_id AS "departmentId",
         d.name AS "departmentName", u.contributor_bio AS "contributorBio",
         u.rejection_reason AS "rejectionReason", u.reviewed_by AS "reviewedBy",
         u.reviewed_at AS "reviewedAt", u.created_at AS "createdAt",
         u.password_hash AS "passwordHash", u.salt, u.iterations, u.algorithm,
         COALESCE(ARRAY(
           SELECT c.code
           FROM lecturer_course_assignments lca
           JOIN courses c ON c.id = lca.course_id
           WHERE lca.lecturer_id = u.id
           ORDER BY c.code
         ), ARRAY[]::VARCHAR[]) AS "assignedCourseCodes"
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id
`;

function toIsoString(value: Date | string | null): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapPgUser(row: PgUserRow): DbUserRecord {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    status: row.status,
    requestedRole: row.requestedRole ?? undefined,
    departmentId: row.departmentId ?? undefined,
    departmentName: row.departmentName ?? undefined,
    contributorBio: row.contributorBio ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: toIsoString(row.reviewedAt),
    createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString(),
    assignedCourseCodes: row.assignedCourseCodes ?? [],
    passwordHash: row.passwordHash,
    salt: row.salt,
    iterations: Number(row.iterations),
    algorithm: row.algorithm,
      must_change_password: row.must_change_password ?? false
    };
}

export async function findPgUserByEmail(email: string): Promise<DbUserRecord | undefined> {
  const result = await pgClient.query<PgUserRow>(`${PG_USER_SELECT} WHERE lower(u.email) = lower($1)`, [email.trim()]);
  return result.rows[0] ? mapPgUser(result.rows[0]) : undefined;
}

export async function findPgUserById(id: string): Promise<DbUserRecord | undefined> {
  const result = await pgClient.query<PgUserRow>(`${PG_USER_SELECT} WHERE u.id = $1`, [id]);
  return result.rows[0] ? mapPgUser(result.rows[0]) : undefined;
}

export async function insertPgAudit(
  client: PoolClient,
  actor: { id?: string; name?: string; role?: string } | undefined,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [actor?.id ?? null, actor?.name ?? null, actor?.role ?? null, action, targetType, targetId, metadata ? JSON.stringify(metadata) : null, ipAddress ?? null]
  );
}

export async function recordPgAudit(
  actor: { id?: string; name?: string; role?: string } | undefined,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await pgClient.transaction(client => insertPgAudit(client, actor, action, targetType, targetId, metadata, ipAddress));
}
