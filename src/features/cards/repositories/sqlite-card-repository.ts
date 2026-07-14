import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { replaceEntityTags } from '@/database/repositories/repository-utils';
import type { CardRow } from '@/database/rows/card-row';
import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import { CardNotFoundError, DatabaseError, DeckNotFoundError } from '@/shared/errors/app-error';
import { escapeLikePattern } from '@/shared/utils/strings';
import { mapCardRow } from '../mappers/card-mapper';
import type { Card, CreateCardInput, FindCardOptions, UpdateCardInput } from '../types/card';
import type { CardRepository } from './card-repository';

const CARD_SELECT = `SELECT c.*,
 (SELECT group_concat(t.name, char(31)) FROM tags t JOIN card_tags ct ON ct.tag_id=t.id WHERE ct.card_id=c.id) tags
 FROM cards c`;
const SORT_COLUMNS = {
  frontText: 'c.front_text',
  createdAt: 'c.created_at',
  updatedAt: 'c.updated_at',
} as const;

export class SQLiteCardRepository implements CardRepository {
  constructor(private readonly database: SQLiteDatabase) {}

  async findAll(options: FindCardOptions): Promise<Card[]> {
    const clauses = ['c.deck_id=?', 'c.deleted_at IS NULL'];
    const params: (string | number)[] = [options.deckId];
    if (options.search?.trim()) {
      const p = `%${escapeLikePattern(options.search.trim())}%`;
      clauses.push(
        `(c.front_text LIKE ? ESCAPE '\\' OR c.back_text LIKE ? ESCAPE '\\' OR c.phonetic LIKE ? ESCAPE '\\' OR c.example_text LIKE ? ESCAPE '\\' OR c.note LIKE ? ESCAPE '\\')`,
      );
      params.push(p, p, p, p, p);
    }
    if (options.tagIds?.length) {
      clauses.push(
        `EXISTS (SELECT 1 FROM card_tags fct WHERE fct.card_id=c.id AND fct.tag_id IN (${options.tagIds.map(() => '?').join(',')}))`,
      );
      params.push(...options.tagIds);
    }
    const column = SORT_COLUMNS[options.sortBy ?? 'updatedAt'];
    const direction = options.sortDirection === 'asc' ? 'ASC' : 'DESC';
    params.push(Math.min(Math.max(options.limit ?? 20, 1), 100), Math.max(options.offset ?? 0, 0));
    const rows = await this.database.getAllAsync<CardRow>(
      `${CARD_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY ${column} ${direction} LIMIT ? OFFSET ?`,
      params,
    );
    return rows.map(mapCardRow);
  }

  async findById(id: string): Promise<Card | null> {
    const row = await this.database.getFirstAsync<CardRow>(
      `${CARD_SELECT} WHERE c.id=? AND c.deleted_at IS NULL`,
      [id],
    );
    return row ? mapCardRow(row) : null;
  }

  async create(input: CreateCardInput): Promise<Card> {
    const deck = await this.database.getFirstAsync<{ id: string }>(
      `SELECT id FROM decks WHERE id=? AND deleted_at IS NULL`,
      [input.deckId],
    );
    if (!deck) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
    const id = randomUUID();
    const progressId = randomUUID();
    const now = Date.now();
    try {
      await this.database.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(
          `INSERT INTO cards
          (id,deck_id,front_text,back_text,phonetic,part_of_speech,example_text,example_translation,image_uri,audio_uri,note,synonyms,antonyms,difficulty,created_at,updated_at,sync_status)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`,
          [
            id,
            input.deckId,
            input.frontText.trim(),
            input.backText.trim(),
            input.phonetic?.trim() || null,
            input.partOfSpeech?.trim() || null,
            input.exampleText?.trim() || null,
            input.exampleTranslation?.trim() || null,
            input.imageUri ?? null,
            input.audioUri ?? null,
            input.note?.trim() || null,
            JSON.stringify(input.synonyms ?? []),
            JSON.stringify(input.antonyms ?? []),
            input.difficulty ?? 0,
            now,
            now,
          ],
        );
        await replaceEntityTags(tx, 'card_tags', 'card_id', id, input.tagIds ?? []);
        await tx.runAsync(
          `INSERT INTO card_progress(id,card_id,created_at,updated_at,sync_status) VALUES(?,?,?,?,'pending')`,
          [progressId, id, now, now],
        );
        const queue = new SQLiteSyncQueueRepository(tx);
        await queue.enqueue({
          entityType: 'card',
          entityId: id,
          operation: 'create',
          payload: input,
        });
        await queue.enqueue({
          entityType: 'card_progress',
          entityId: progressId,
          operation: 'create',
        });
      });
      const card = await this.findById(id);
      if (!card) throw new CardNotFoundError('Flashcard vừa tạo không tồn tại.');
      return card;
    } catch (error: unknown) {
      if (error instanceof CardNotFoundError) throw error;
      throw new DatabaseError('Không thể tạo flashcard.', { cause: error });
    }
  }

  async update(id: string, input: UpdateCardInput): Promise<Card> {
    const current = await this.findById(id);
    if (!current) throw new CardNotFoundError('Không tìm thấy flashcard.');
    const next = { ...current, ...input };
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE cards SET front_text=?,back_text=?,phonetic=?,part_of_speech=?,example_text=?,example_translation=?,image_uri=?,audio_uri=?,note=?,synonyms=?,antonyms=?,difficulty=?,updated_at=?,sync_status='pending' WHERE id=? AND deleted_at IS NULL`,
        [
          next.frontText.trim(),
          next.backText.trim(),
          next.phonetic?.trim() || null,
          next.partOfSpeech?.trim() || null,
          next.exampleText?.trim() || null,
          next.exampleTranslation?.trim() || null,
          next.imageUri,
          next.audioUri,
          next.note?.trim() || null,
          JSON.stringify(next.synonyms),
          JSON.stringify(next.antonyms),
          next.difficulty,
          now,
          id,
        ],
      );
      if (input.tagIds) await replaceEntityTags(tx, 'card_tags', 'card_id', id, input.tagIds);
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'card',
        entityId: id,
        operation: 'update',
        payload: input,
      });
    });
    const card = await this.findById(id);
    if (!card) throw new CardNotFoundError('Không tìm thấy flashcard.');
    return card;
  }

  async softDelete(id: string): Promise<void> {
    const current = await this.findById(id);
    if (!current) throw new CardNotFoundError('Không tìm thấy flashcard.');
    const queueRow = await this.database.getFirstAsync<{ operation: string }>(
      `SELECT operation FROM sync_queue WHERE entity_type='card' AND entity_id=? AND status='pending'`,
      [id],
    );
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      const queue = new SQLiteSyncQueueRepository(tx);
      if (queueRow?.operation === 'create') {
        await queue.removeByEntity('card', id);
        await tx.runAsync(`DELETE FROM cards WHERE id=?`, [id]);
      } else {
        const now = Date.now();
        await tx.runAsync(
          `UPDATE cards SET deleted_at=?,updated_at=?,sync_status='pending' WHERE id=?`,
          [now, now, id],
        );
        await queue.enqueue({ entityType: 'card', entityId: id, operation: 'delete' });
      }
    });
  }

  async restore(id: string): Promise<void> {
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE cards SET deleted_at=NULL,updated_at=?,sync_status='pending' WHERE id=?`,
        [now, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'card',
        entityId: id,
        operation: 'update',
      });
    });
  }

  async countByDeckId(deckId: string): Promise<number> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) count FROM cards WHERE deck_id=? AND deleted_at IS NULL`,
      [deckId],
    );
    return row?.count ?? 0;
  }

  async existsByFrontText(
    deckId: string,
    frontText: string,
    excludeCardId?: string,
  ): Promise<boolean> {
    const row = await this.database.getFirstAsync<{ found: number }>(
      `SELECT 1 found FROM cards WHERE deck_id=? AND front_text=? COLLATE NOCASE AND deleted_at IS NULL AND (? IS NULL OR id<>?) LIMIT 1`,
      [deckId, frontText.trim(), excludeCardId ?? null, excludeCardId ?? null],
    );
    return row !== null;
  }
}
