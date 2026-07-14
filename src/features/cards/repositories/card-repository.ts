import type { Card, CreateCardInput, FindCardOptions, UpdateCardInput } from '../types/card';

export interface CardRepository {
  findAll(options: FindCardOptions): Promise<Card[]>;
  findById(id: string): Promise<Card | null>;
  create(input: CreateCardInput): Promise<Card>;
  update(id: string, input: UpdateCardInput): Promise<Card>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  countByDeckId(deckId: string): Promise<number>;
  existsByFrontText(deckId: string, frontText: string, excludeCardId?: string): Promise<boolean>;
}
