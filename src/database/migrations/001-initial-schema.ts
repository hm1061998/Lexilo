import type { DatabaseMigration } from './types';

const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT, name TEXT NOT NULL, description TEXT,
  language_from TEXT NOT NULL DEFAULT 'en', language_to TEXT NOT NULL DEFAULT 'vi',
  cover_image_uri TEXT, is_public INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL, deleted_at INTEGER, sync_status TEXT NOT NULL DEFAULT 'pending',
  server_version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL, deck_id TEXT NOT NULL, front_text TEXT NOT NULL,
  back_text TEXT NOT NULL, phonetic TEXT, part_of_speech TEXT, example_text TEXT,
  example_translation TEXT, image_uri TEXT, audio_uri TEXT, note TEXT, synonyms TEXT,
  antonyms TEXT, difficulty INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL, deleted_at INTEGER, sync_status TEXT NOT NULL DEFAULT 'pending',
  server_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, color TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS deck_tags (
  deck_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (deck_id, tag_id),
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS card_tags (
  card_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (card_id, tag_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS card_progress (
  id TEXT PRIMARY KEY NOT NULL, card_id TEXT NOT NULL UNIQUE, user_id TEXT,
  status TEXT NOT NULL DEFAULT 'new', repetitions INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 0, ease_factor REAL NOT NULL DEFAULT 2.5,
  next_review_at INTEGER, last_reviewed_at INTEGER, correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0, lapse_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending', server_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY NOT NULL, deck_id TEXT, mode TEXT NOT NULL, started_at INTEGER NOT NULL,
  completed_at INTEGER, total_cards INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0, incorrect_answers INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0, earned_xp INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending', server_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY NOT NULL, card_id TEXT NOT NULL, session_id TEXT NOT NULL,
  answer_type TEXT NOT NULL, quality INTEGER NOT NULL, is_correct INTEGER NOT NULL,
  response_time_ms INTEGER, previous_interval_days INTEGER NOT NULL DEFAULT 0,
  new_interval_days INTEGER NOT NULL DEFAULT 0, previous_ease_factor REAL,
  new_ease_factor REAL, reviewed_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending', server_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS daily_statistics (
  id TEXT PRIMARY KEY NOT NULL, study_date TEXT NOT NULL UNIQUE,
  studied_cards INTEGER NOT NULL DEFAULT 0, correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0, new_cards INTEGER NOT NULL DEFAULT 0,
  reviewed_cards INTEGER NOT NULL DEFAULT 0, study_seconds INTEGER NOT NULL DEFAULT 0,
  earned_xp INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL, sync_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL, value TEXT, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  operation TEXT NOT NULL, payload TEXT, retry_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL,
  last_attempt_at INTEGER, next_retry_at INTEGER, error_message TEXT
);
CREATE TABLE IF NOT EXISTS sync_metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_updated_at ON cards(updated_at);
CREATE INDEX IF NOT EXISTS idx_progress_next_review ON card_progress(next_review_at);
CREATE INDEX IF NOT EXISTS idx_progress_status ON card_progress(status);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at);
`;

export const initialSchemaMigration: DatabaseMigration = {
  version: 1,
  name: 'initial-schema',
  async up(database) {
    await database.execAsync(INITIAL_SCHEMA);
  },
};
