import type { SyncStatus } from '@/shared/types/sync';

export interface DeckRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  language_from: string;
  language_to: string;
  cover_image_uri: string | null;
  is_public: number;
  is_favorite: number;
  card_count: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sync_status: SyncStatus;
  server_version: number;
  tags: string | null;
}
