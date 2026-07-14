import type { Tag } from '../types/tag';

export interface TagRepository {
  findAll(search?: string): Promise<Tag[]>;
  findById(id: string): Promise<Tag | null>;
  findOrCreateByName(name: string): Promise<Tag>;
  create(name: string, color?: string | null): Promise<Tag>;
  update(id: string, input: { name?: string; color?: string | null }): Promise<Tag>;
  delete(id: string): Promise<void>;
}
