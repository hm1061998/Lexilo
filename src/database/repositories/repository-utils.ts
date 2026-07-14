import type { SQLiteDatabase } from 'expo-sqlite';

export async function replaceEntityTags(
  database: SQLiteDatabase,
  table: 'deck_tags' | 'card_tags',
  idColumn: 'deck_id' | 'card_id',
  entityId: string,
  tagIds: readonly string[],
): Promise<void> {
  await database.runAsync(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [entityId]);
  for (const tagId of [...new Set(tagIds)]) {
    await database.runAsync(`INSERT OR IGNORE INTO ${table} (${idColumn}, tag_id) VALUES (?, ?)`, [
      entityId,
      tagId,
    ]);
  }
}
