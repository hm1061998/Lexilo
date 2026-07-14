import type { SyncStatus } from '@/shared/types/sync';

export interface Card {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  exampleText: string | null;
  exampleTranslation: string | null;
  imageUri: string | null;
  audioUri: string | null;
  note: string | null;
  synonyms: string[];
  antonyms: string[];
  difficulty: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  syncStatus: SyncStatus;
  serverVersion: number;
  tags: readonly string[];
}

export interface CreateCardInput {
  deckId: string;
  frontText: string;
  backText: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  exampleText?: string | null;
  exampleTranslation?: string | null;
  imageUri?: string | null;
  audioUri?: string | null;
  note?: string | null;
  synonyms?: string[];
  antonyms?: string[];
  difficulty?: number;
  tagIds?: string[];
}

export type UpdateCardInput = Partial<Omit<CreateCardInput, 'deckId'>>;

export interface FindCardOptions {
  deckId: string;
  search?: string;
  tagIds?: string[];
  sortBy?: 'frontText' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
