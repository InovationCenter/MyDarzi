import { open, type DB } from '@op-engineering/op-sqlite';
import { logger } from '../../shared/logger';
import { MIGRATIONS } from './migrations';

const DB_NAME = 'mydarzi.db';

export type Database = DB;

let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = open({ name: DB_NAME });
  await db.execute('PRAGMA foreign_keys = ON;');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = await db.execute(
    'SELECT version FROM schema_migrations ORDER BY version ASC;',
  );
  const appliedVersions = new Set(
    applied.rows.map(row => Number((row as { version: number }).version)),
  );

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    logger.info(`Applying migration v${migration.version}`);
    try {
      await db.transaction(async tx => {
        for (const statement of migration.statements) {
          await tx.execute(statement);
        }
        await tx.execute(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
          [migration.version, new Date().toISOString()],
        );
      });
    } catch (error) {
      logger.error(`Migration v${migration.version} failed`, error);
      throw error;
    }
  }

  dbInstance = db;
  logger.info('Database ready');
  return db;
}
