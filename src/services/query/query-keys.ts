import type { FindCardOptions } from '@/features/cards/types/card';
import type { FindDeckOptions } from '@/features/decks/types/deck';

export const queryKeys = {
  decks: {
    all: ['decks'] as const,
    list: (options: FindDeckOptions) => ['decks', 'list', options] as const,
    detail: (id: string) => ['decks', 'detail', id] as const,
    statistics: (id: string) => ['decks', 'statistics', id] as const,
  },
  cards: {
    all: ['cards'] as const,
    list: (options: FindCardOptions) => ['cards', 'list', options] as const,
    detail: (id: string) => ['cards', 'detail', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    list: (search?: string) => ['tags', 'list', search ?? ''] as const,
  },
  study: {
    active: ['study', 'active'] as const,
    session: (id: string) => ['study', 'session', id] as const,
    currentItem: (id: string) => ['study', 'session', id, 'current-item'] as const,
    result: (id: string) => ['study', 'result', id] as const,
  },
};
