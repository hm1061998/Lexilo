import type {
  CreateDeckInput,
  Deck,
  DeckStatistics,
  FindDeckOptions,
  UpdateDeckInput,
} from '../types/deck';

export interface DeckRepository {
  findAll(options?: FindDeckOptions): Promise<Deck[]>;
  findById(id: string): Promise<Deck | null>;
  create(input: CreateDeckInput): Promise<Deck>;
  update(id: string, input: UpdateDeckInput): Promise<Deck>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  duplicate(id: string): Promise<Deck>;
  getStatistics(id: string): Promise<DeckStatistics>;
  count(options?: FindDeckOptions): Promise<number>;
}
