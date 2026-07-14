import type { SQLiteDatabase } from 'expo-sqlite';

export interface DatabaseMigration {
  version: number;
  name: string;
  up(database: SQLiteDatabase): Promise<void>;
}
