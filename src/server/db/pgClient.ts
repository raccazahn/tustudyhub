/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub PostgreSQL connection pool and schema migration foundation.
 */

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

const MIGRATIONS = [
  { version: '001_initial_schema', url: new URL('./schema.sql', import.meta.url) },
  { version: '002_stage3b_domain_snapshots', url: new URL('./migrations/002_stage3b_domain_snapshots.sql', import.meta.url) },
  { version: '003_stage7_notifications', url: new URL('./migrations/003_stage7_notifications.sql', import.meta.url) },
  { version: '004_stage8_document_stamping', url: new URL('./migrations/004_stage8_document_stamping.sql', import.meta.url) },
  { version: '005_password_management', url: new URL('./migrations/005_password_management.sql', import.meta.url) }
];
const MIGRATION_LOCK_KEY = 'tustudyhub:initial-schema';

export interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export class PgDatabaseClient {
  private static instance: PgDatabaseClient;
  private readonly connectionString: string | null;
  private readonly isConfigured: boolean;
  private pool: Pool | null = null;

  private constructor() {
    this.connectionString = process.env.DATABASE_URL?.trim() || null;
    this.isConfigured = Boolean(this.connectionString || (process.env.PGHOST && process.env.PGDATABASE));
  }

  public static getInstance(): PgDatabaseClient {
    if (!PgDatabaseClient.instance) {
      PgDatabaseClient.instance = new PgDatabaseClient();
    }
    return PgDatabaseClient.instance;
  }

  public getStatus(): { isConfigured: boolean; engine: 'POSTGRESQL' | 'IN_MEMORY_DEV_STORE' } {
    return {
      isConfigured: this.isConfigured,
      engine: this.isConfigured ? 'POSTGRESQL' : 'IN_MEMORY_DEV_STORE'
    };
  }

  public async checkConnection(): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      await this.getPool().query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  public isPostgresEnabled(): boolean {
    return this.isConfigured && (process.env.NODE_ENV !== 'test' || process.env.PG_INTEGRATION_TESTS === '1');
  }

  public query<T extends QueryResultRow = QueryResultRow>(text: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    return this.getPool().query<T>(text, [...values]);
  }

  public async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  public async migrate(): Promise<{ applied: boolean; version: string; appliedVersions: string[] }> {
    const client = await this.getPool().connect();
    const appliedVersions: string[] = [];
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [MIGRATION_LOCK_KEY]);
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          version TEXT PRIMARY KEY,
          checksum TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      for (const migration of MIGRATIONS) {
        const schema = await readFile(migration.url, 'utf8');
        const checksum = createHash('sha256').update(schema).digest('hex');
        const existing = await client.query<{ checksum: string }>(
          'SELECT checksum FROM public.schema_migrations WHERE version = $1 FOR UPDATE',
          [migration.version]
        );

        if (existing.rowCount) {
          if (existing.rows[0].checksum !== checksum) {
            throw new Error(`Applied migration ${migration.version} checksum differs from the current schema.`);
          }
          continue;
        }

        await client.query(schema);
        await client.query(
          'INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)',
          [migration.version, checksum]
        );
        appliedVersions.push(migration.version);
      }

      await client.query('COMMIT');
      return {
        applied: appliedVersions.length > 0,
        version: MIGRATIONS[MIGRATIONS.length - 1].version,
        appliedVersions
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (error instanceof Error && error.message.startsWith('Applied migration ')) {
        throw error;
      }
      throw new Error('PostgreSQL migration failed; verify database access and schema permissions.');
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    if (!this.pool) return;
    await this.pool.end();
    this.pool = null;
  }

  private getPool(): Pool {
    if (!this.isConfigured) {
      throw new Error('PostgreSQL is not configured. Set DATABASE_URL or PGHOST and PGDATABASE.');
    }
    if (!this.pool) {
      const config: DbConfig = this.connectionString
        ? { connectionString: this.connectionString }
        : {
            host: process.env.PGHOST,
            port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE
          };
      this.pool = new Pool({
        ...config,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000
      });
    }
    return this.pool;
  }
}

export const pgClient = PgDatabaseClient.getInstance();
