import type { CardRow } from '@/database/rows/card-row';
import type { Card } from '../types/card';

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    frontText: row.front_text,
    backText: row.back_text,
    phonetic: row.phonetic,
    partOfSpeech: row.part_of_speech,
    exampleText: row.example_text,
    exampleTranslation: row.example_translation,
    imageUri: row.image_uri,
    audioUri: row.audio_uri,
    note: row.note,
    synonyms: parseJsonArray(row.synonyms),
    antonyms: parseJsonArray(row.antonyms),
    difficulty: row.difficulty,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    serverVersion: row.server_version,
    tags: row.tags ? row.tags.split('\u001f') : [],
  };
}
