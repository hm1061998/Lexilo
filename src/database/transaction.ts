import type { SQLiteDatabase } from 'expo-sqlite';

export function withTransaction(
  database: SQLiteDatabase,
  operation: (transaction: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  return database.withExclusiveTransactionAsync(operation);
}
