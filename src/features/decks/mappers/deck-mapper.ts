import type { DeckRow } from '@/database/rows/deck-row';
import type { Deck } from '../types/deck';

export function mapDeckRow(row: DeckRow): Deck {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    languageFrom: row.language_from,
    languageTo: row.language_to,
    coverImageUri: row.cover_image_uri,
    isPublic: row.is_public === 1,
    isFavorite: row.is_favorite === 1,
    cardCount: row.card_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    serverVersion: row.server_version,
    tags: row.tags ? row.tags.split('\u001f') : [],
  };
}
