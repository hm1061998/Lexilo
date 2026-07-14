import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from '@/shared/errors/app-error';
import { DATABASE_VERSION } from './database';
import { migrations } from './migrations';
import { seedDevelopmentData } from './seeds/seed-development-data';

interface UserVersionRow {
  user_version: number;
}

export async function initializeDatabase(database: SQLiteDatabase): Promise<void> {
  try {
    await database.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const row = await database.getFirstAsync<UserVersionRow>('PRAGMA user_version');
    let currentVersion = row?.user_version ?? 0;

    for (const migration of migrations) {
      if (migration.version <= currentVersion) continue;

      await database.withExclusiveTransactionAsync(async (transaction) => {
        await migration.up(transaction);
        await transaction.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
      currentVersion = migration.version;
    }

    if (currentVersion !== DATABASE_VERSION) {
      throw new DatabaseError(`Unsupported database version: ${currentVersion}`);
    }
    await seedDevelopmentData(database);
  } catch (error: unknown) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unable to initialize the local database.', { cause: error });
  }
}
