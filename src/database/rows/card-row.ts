import type { SyncStatus } from '@/shared/types/sync';

export interface CardRow {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  phonetic: string | null;
  part_of_speech: string | null;
  example_text: string | null;
  example_translation: string | null;
  image_uri: string | null;
  audio_uri: string | null;
  note: string | null;
  synonyms: string | null;
  antonyms: string | null;
  difficulty: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sync_status: SyncStatus;
  server_version: number;
  tags: string | null;
}
