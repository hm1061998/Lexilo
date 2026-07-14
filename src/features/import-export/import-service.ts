import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import type { CsvCardRow } from './csv-parser';

export type DuplicateStrategy = 'skip' | 'create' | 'update';
export async function importCsvRows(
  database: SQLiteDatabase,
  deckId: string,
  rows: readonly CsvCardRow[],
  strategy: DuplicateStrategy,
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;
  await database.withExclusiveTransactionAsync(async (tx) => {
    const queue = new SQLiteSyncQueueRepository(tx);
    for (const row of rows) {
      const existing = await tx.getFirstAsync<{ id: string }>(
        `SELECT id FROM cards WHERE deck_id=? AND front_text=? COLLATE NOCASE AND deleted_at IS NULL`,
        [deckId, row.frontText],
      );
      if (existing && strategy === 'skip') {
        skipped++;
        continue;
      }
      const cardId = existing && strategy === 'update' ? existing.id : randomUUID();
      const now = Date.now();
      if (existing && strategy === 'update') {
        await tx.runAsync(
          `UPDATE cards SET back_text=?,phonetic=?,part_of_speech=?,example_text=?,example_translation=?,note=?,synonyms=?,antonyms=?,difficulty=?,updated_at=?,sync_status='pending' WHERE id=?`,
          [
            row.backText,
            row.phonetic,
            row.partOfSpeech,
            row.exampleText,
            row.exampleTranslation,
            row.note,
            JSON.stringify(row.synonyms),
            JSON.stringify(row.antonyms),
            row.difficulty,
            now,
            cardId,
          ],
        );
        await queue.enqueue({ entityType: 'card', entityId: cardId, operation: 'update' });
      } else {
        await tx.runAsync(
          `INSERT INTO cards(id,deck_id,front_text,back_text,phonetic,part_of_speech,example_text,example_translation,note,synonyms,antonyms,difficulty,created_at,updated_at,sync_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
          [
            cardId,
            deckId,
            row.frontText,
            row.backText,
            row.phonetic,
            row.partOfSpeech,
            row.exampleText,
            row.exampleTranslation,
            row.note,
            JSON.stringify(row.synonyms),
            JSON.stringify(row.antonyms),
            row.difficulty,
            now,
            now,
          ],
        );
        const progressId = randomUUID();
        await tx.runAsync(
          `INSERT INTO card_progress(id,card_id,created_at,updated_at,sync_status) VALUES(?,?,?,?,'pending')`,
          [progressId, cardId, now, now],
        );
        await queue.enqueue({ entityType: 'card', entityId: cardId, operation: 'create' });
      }
      await tx.runAsync(`DELETE FROM card_tags WHERE card_id=?`, [cardId]);
      for (const name of row.tagNames) {
        let tag = await tx.getFirstAsync<{ id: string }>(
          `SELECT id FROM tags WHERE name=? COLLATE NOCASE`,
          [name],
        );
        if (!tag) {
          tag = { id: randomUUID() };
          await tx.runAsync(`INSERT INTO tags(id,name,created_at,updated_at) VALUES(?,?,?,?)`, [
            tag.id,
            name,
            now,
            now,
          ]);
          await queue.enqueue({ entityType: 'tag', entityId: tag.id, operation: 'create' });
        }
        await tx.runAsync(`INSERT OR IGNORE INTO card_tags(card_id,tag_id) VALUES(?,?)`, [
          cardId,
          tag.id,
        ]);
      }
      imported++;
    }
  });
  return { imported, skipped };
}
