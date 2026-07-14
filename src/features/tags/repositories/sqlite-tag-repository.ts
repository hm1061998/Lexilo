import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import { DatabaseError, TagAlreadyExistsError } from '@/shared/errors/app-error';
import { escapeLikePattern } from '@/shared/utils/strings';
import type { Tag } from '../types/tag';
import type { TagRepository } from './tag-repository';

interface TagRow {
  id: string;
  name: string;
  color: string | null;
  created_at: number;
  updated_at: number;
}
const mapTag = (row: TagRow): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SQLiteTagRepository implements TagRepository {
  constructor(private readonly database: SQLiteDatabase) {}
  async findAll(search?: string): Promise<Tag[]> {
    const p = `%${escapeLikePattern(search?.trim() ?? '')}%`;
    const rows = await this.database.getAllAsync<TagRow>(
      `SELECT * FROM tags WHERE name LIKE ? ESCAPE '\\' ORDER BY name COLLATE NOCASE`,
      [p],
    );
    return rows.map(mapTag);
  }
  async findById(id: string): Promise<Tag | null> {
    const row = await this.database.getFirstAsync<TagRow>(`SELECT * FROM tags WHERE id=?`, [id]);
    return row ? mapTag(row) : null;
  }
  async findOrCreateByName(name: string): Promise<Tag> {
    const row = await this.database.getFirstAsync<TagRow>(
      `SELECT * FROM tags WHERE name=? COLLATE NOCASE`,
      [name.trim()],
    );
    return row ? mapTag(row) : this.create(name);
  }
  async create(name: string, color: string | null = null): Promise<Tag> {
    const clean = name.trim();
    if (!clean || clean.length > 50) throw new TagAlreadyExistsError('Tên tag không hợp lệ.');
    const id = randomUUID();
    const now = Date.now();
    try {
      await this.database.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(
          `INSERT INTO tags(id,name,color,created_at,updated_at) VALUES(?,?,?,?,?)`,
          [id, clean, color, now, now],
        );
        await new SQLiteSyncQueueRepository(tx).enqueue({
          entityType: 'tag',
          entityId: id,
          operation: 'create',
          payload: { name: clean, color },
        });
      });
    } catch (error: unknown) {
      throw new DatabaseError('Không thể tạo tag.', { cause: error });
    }
    const tag = await this.findById(id);
    if (!tag) throw new DatabaseError('Tag vừa tạo không tồn tại.');
    return tag;
  }
  async update(id: string, input: { name?: string; color?: string | null }): Promise<Tag> {
    const current = await this.findById(id);
    if (!current) throw new DatabaseError('Không tìm thấy tag.');
    const now = Date.now();
    const name = input.name?.trim() ?? current.name;
    const color = input.color === undefined ? current.color : input.color;
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(`UPDATE tags SET name=?,color=?,updated_at=? WHERE id=?`, [
        name,
        color,
        now,
        id,
      ]);
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'tag',
        entityId: id,
        operation: 'update',
        payload: input,
      });
    });
    const tag = await this.findById(id);
    if (!tag) throw new DatabaseError('Không tìm thấy tag.');
    return tag;
  }
  async delete(id: string): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(`DELETE FROM deck_tags WHERE tag_id=?`, [id]);
      await tx.runAsync(`DELETE FROM card_tags WHERE tag_id=?`, [id]);
      await tx.runAsync(`DELETE FROM tags WHERE id=?`, [id]);
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'tag',
        entityId: id,
        operation: 'delete',
      });
    });
  }
}
