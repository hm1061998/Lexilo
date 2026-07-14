import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { replaceEntityTags } from '@/database/repositories/repository-utils';
import type { DeckRow } from '@/database/rows/deck-row';
import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import { DatabaseError, DeckNotFoundError } from '@/shared/errors/app-error';
import { escapeLikePattern } from '@/shared/utils/strings';
import { mapDeckRow } from '../mappers/deck-mapper';
import type {
  CreateDeckInput,
  Deck,
  DeckStatistics,
  FindDeckOptions,
  UpdateDeckInput,
} from '../types/deck';
import type { DeckRepository } from './deck-repository';

type SqlValue = string | number | null;
const DECK_SELECT = `SELECT d.*,
  (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id AND c.deleted_at IS NULL) AS card_count,
  (SELECT group_concat(t.name, char(31)) FROM tags t JOIN deck_tags dt ON dt.tag_id=t.id WHERE dt.deck_id=d.id) AS tags
  FROM decks d`;
const SORT_COLUMNS = {
  name: 'd.name',
  createdAt: 'd.created_at',
  updatedAt: 'd.updated_at',
} as const;

function buildFilter(options: FindDeckOptions = {}) {
  const clauses = ['d.deleted_at IS NULL'];
  const params: SqlValue[] = [];
  if (options.search?.trim()) {
    const pattern = `%${escapeLikePattern(options.search.trim())}%`;
    clauses.push(`(d.name LIKE ? ESCAPE '\\' OR d.description LIKE ? ESCAPE '\\')`);
    params.push(pattern, pattern);
  }
  if (options.isFavorite !== undefined) {
    clauses.push('d.is_favorite = ?');
    params.push(options.isFavorite ? 1 : 0);
  }
  if (options.tagIds?.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM deck_tags fdt WHERE fdt.deck_id=d.id AND fdt.tag_id IN (${options.tagIds.map(() => '?').join(',')}))`,
    );
    params.push(...options.tagIds);
  }
  return { where: clauses.join(' AND '), params };
}

export class SQLiteDeckRepository implements DeckRepository {
  constructor(private readonly database: SQLiteDatabase) {}

  async findAll(options: FindDeckOptions = {}): Promise<Deck[]> {
    const { where, params } = buildFilter(options);
    const column = SORT_COLUMNS[options.sortBy ?? 'updatedAt'];
    const direction = options.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);
    const rows = await this.database.getAllAsync<DeckRow>(
      `${DECK_SELECT} WHERE ${where} ORDER BY ${column} ${direction} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    return rows.map(mapDeckRow);
  }

  async findById(id: string): Promise<Deck | null> {
    const row = await this.database.getFirstAsync<DeckRow>(
      `${DECK_SELECT} WHERE d.id = ? AND d.deleted_at IS NULL`,
      [id],
    );
    return row ? mapDeckRow(row) : null;
  }

  async create(input: CreateDeckInput): Promise<Deck> {
    const id = randomUUID();
    const now = Date.now();
    try {
      await this.database.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(
          `INSERT INTO decks (id,name,description,language_from,language_to,cover_image_uri,is_favorite,created_at,updated_at,sync_status)
           VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
          [
            id,
            input.name.trim(),
            input.description?.trim() || null,
            input.languageFrom ?? 'en',
            input.languageTo ?? 'vi',
            input.coverImageUri ?? null,
            input.isFavorite ? 1 : 0,
            now,
            now,
          ],
        );
        await replaceEntityTags(tx, 'deck_tags', 'deck_id', id, input.tagIds ?? []);
        await new SQLiteSyncQueueRepository(tx).enqueue({
          entityType: 'deck',
          entityId: id,
          operation: 'create',
          payload: input,
        });
      });
      const deck = await this.findById(id);
      if (!deck) throw new DeckNotFoundError('Deck vừa tạo không tồn tại.');
      return deck;
    } catch (error: unknown) {
      if (error instanceof DeckNotFoundError) throw error;
      throw new DatabaseError('Không thể tạo bộ thẻ.', { cause: error });
    }
  }

  async update(id: string, input: UpdateDeckInput): Promise<Deck> {
    const current = await this.findById(id);
    if (!current) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
    const next = { ...current, ...input };
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE decks SET name=?,description=?,language_from=?,language_to=?,cover_image_uri=?,is_favorite=?,updated_at=?,sync_status='pending' WHERE id=? AND deleted_at IS NULL`,
        [
          next.name.trim(),
          next.description?.trim() || null,
          next.languageFrom,
          next.languageTo,
          next.coverImageUri,
          next.isFavorite ? 1 : 0,
          now,
          id,
        ],
      );
      if (input.tagIds) await replaceEntityTags(tx, 'deck_tags', 'deck_id', id, input.tagIds);
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'deck',
        entityId: id,
        operation: 'update',
        payload: input,
      });
    });
    const deck = await this.findById(id);
    if (!deck) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
    return deck;
  }

  async softDelete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE decks SET deleted_at=?,updated_at=?,sync_status='pending' WHERE id=?`,
        [now, now, id],
      );
      await tx.runAsync(
        `UPDATE cards SET deleted_at=?,updated_at=?,sync_status='pending' WHERE deck_id=? AND deleted_at IS NULL`,
        [now, now, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'deck',
        entityId: id,
        operation: 'delete',
      });
    });
  }

  async restore(id: string): Promise<void> {
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE decks SET deleted_at=NULL,updated_at=?,sync_status='pending' WHERE id=?`,
        [now, id],
      );
      await tx.runAsync(
        `UPDATE cards SET deleted_at=NULL,updated_at=?,sync_status='pending' WHERE deck_id=?`,
        [now, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'deck',
        entityId: id,
        operation: 'update',
      });
    });
  }

  async duplicate(id: string): Promise<Deck> {
    const source = await this.findById(id);
    if (!source) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
    const newId = randomUUID();
    const now = Date.now();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `INSERT INTO decks (id,name,description,language_from,language_to,cover_image_uri,is_favorite,created_at,updated_at,sync_status)
        SELECT ?,name||' - Bản sao',description,language_from,language_to,cover_image_uri,is_favorite,?,?,'pending' FROM decks WHERE id=?`,
        [newId, now, now, id],
      );
      await tx.runAsync(
        `INSERT INTO deck_tags(deck_id,tag_id) SELECT ?,tag_id FROM deck_tags WHERE deck_id=?`,
        [newId, id],
      );
      const cards = await tx.getAllAsync<{ id: string }>(
        `SELECT id FROM cards WHERE deck_id=? AND deleted_at IS NULL`,
        [id],
      );
      const queue = new SQLiteSyncQueueRepository(tx);
      await queue.enqueue({ entityType: 'deck', entityId: newId, operation: 'create' });
      for (const card of cards) {
        const cardId = randomUUID();
        const progressId = randomUUID();
        await tx.runAsync(
          `INSERT INTO cards (id,deck_id,front_text,back_text,phonetic,part_of_speech,example_text,example_translation,image_uri,audio_uri,note,synonyms,antonyms,difficulty,created_at,updated_at,sync_status)
          SELECT ?,?,front_text,back_text,phonetic,part_of_speech,example_text,example_translation,image_uri,audio_uri,note,synonyms,antonyms,difficulty,?,?,'pending' FROM cards WHERE id=?`,
          [cardId, newId, now, now, card.id],
        );
        await tx.runAsync(
          `INSERT INTO card_tags(card_id,tag_id) SELECT ?,tag_id FROM card_tags WHERE card_id=?`,
          [cardId, card.id],
        );
        await tx.runAsync(
          `INSERT INTO card_progress(id,card_id,created_at,updated_at,sync_status) VALUES(?,?,?,?,'pending')`,
          [progressId, cardId, now, now],
        );
        await queue.enqueue({ entityType: 'card', entityId: cardId, operation: 'create' });
      }
    });
    const duplicate = await this.findById(newId);
    if (!duplicate) throw new DeckNotFoundError('Không thể sao chép bộ thẻ.');
    return duplicate;
  }

  async getStatistics(id: string): Promise<DeckStatistics> {
    const row = await this.database.getFirstAsync<DeckStatistics>(
      `SELECT COUNT(c.id) totalCards,
      COALESCE(SUM(CASE WHEN COALESCE(p.status,'new')='new' THEN 1 ELSE 0 END),0) newCards,
      COALESCE(SUM(CASE WHEN p.status IN ('learning','relearning') THEN 1 ELSE 0 END),0) learningCards,
      COALESCE(SUM(CASE WHEN p.status='review' THEN 1 ELSE 0 END),0) reviewCards,
      COALESCE(SUM(CASE WHEN p.status='mastered' THEN 1 ELSE 0 END),0) masteredCards
      FROM cards c LEFT JOIN card_progress p ON p.card_id=c.id WHERE c.deck_id=? AND c.deleted_at IS NULL`,
      [id],
    );
    return (
      row ?? { totalCards: 0, newCards: 0, learningCards: 0, reviewCards: 0, masteredCards: 0 }
    );
  }

  async count(options: FindDeckOptions = {}): Promise<number> {
    const { where, params } = buildFilter(options);
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) count FROM decks d WHERE ${where}`,
      params,
    );
    return row?.count ?? 0;
  }
}
