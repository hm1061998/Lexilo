import type { SyncStatus } from '@/shared/types/sync';

export interface Deck {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  languageFrom: string;
  languageTo: string;
  coverImageUri: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  cardCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  syncStatus: SyncStatus;
  serverVersion: number;
  tags: readonly string[];
}

export interface CreateDeckInput {
  name: string;
  description?: string | null;
  languageFrom?: string;
  languageTo?: string;
  coverImageUri?: string | null;
  isFavorite?: boolean;
  tagIds?: string[];
}

export type UpdateDeckInput = Partial<CreateDeckInput>;

export interface FindDeckOptions {
  search?: string;
  tagIds?: string[];
  isFavorite?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DeckStatistics {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
}
