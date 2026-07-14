import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

import { SQLiteCardRepository } from '@/features/cards/repositories/sqlite-card-repository';
import { SQLiteDeckRepository } from '@/features/decks/repositories/sqlite-deck-repository';
import { SQLiteTagRepository } from '@/features/tags/repositories/sqlite-tag-repository';
import { SQLiteStudyRepository } from '@/features/study/repositories/sqlite-study-repository';

export function useRepositories() {
  const database = useSQLiteContext();
  return useMemo(
    () => ({
      decks: new SQLiteDeckRepository(database),
      cards: new SQLiteCardRepository(database),
      tags: new SQLiteTagRepository(database),
      study: new SQLiteStudyRepository(database),
    }),
    [database],
  );
}
