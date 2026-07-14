import type { DatabaseMigration } from './types';

const STUDY_SCHEMA = `
ALTER TABLE study_sessions ADD COLUMN user_id TEXT;
ALTER TABLE study_sessions ADD COLUMN scope TEXT NOT NULL DEFAULT 'mixed';
ALTER TABLE study_sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE study_sessions ADD COLUMN paused_at INTEGER;
ALTER TABLE study_sessions ADD COLUMN resumed_at INTEGER;
ALTER TABLE study_sessions ADD COLUMN abandoned_at INTEGER;
ALTER TABLE study_sessions ADD COLUMN current_item_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN answered_cards INTEGER NOT NULL DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN skipped_answers INTEGER NOT NULL DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN settings_json TEXT;

CREATE TABLE IF NOT EXISTS study_session_decks (
  session_id TEXT NOT NULL, deck_id TEXT NOT NULL,
  PRIMARY KEY (session_id, deck_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS study_session_items (
  id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, card_id TEXT NOT NULL,
  position INTEGER NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  question_json TEXT, answered_at INTEGER, answer_json TEXT, rating TEXT,
  is_correct INTEGER, response_time_ms INTEGER, created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE RESTRICT,
  UNIQUE (session_id, position)
);

ALTER TABLE review_logs ADD COLUMN session_item_id TEXT;
ALTER TABLE review_logs ADD COLUMN mode TEXT NOT NULL DEFAULT 'flashcard';
ALTER TABLE review_logs ADD COLUMN submitted_answer TEXT;
ALTER TABLE review_logs ADD COLUMN expected_answer TEXT;
ALTER TABLE review_logs ADD COLUMN rating TEXT NOT NULL DEFAULT 'good';
ALTER TABLE review_logs ADD COLUMN previous_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE review_logs ADD COLUMN new_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE review_logs ADD COLUMN previous_repetitions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE review_logs ADD COLUMN new_repetitions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE review_logs ADD COLUMN previous_next_review_at INTEGER;
ALTER TABLE review_logs ADD COLUMN new_next_review_at INTEGER;

ALTER TABLE card_progress ADD COLUMN total_review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE card_progress ADD COLUMN average_response_time_ms INTEGER;
ALTER TABLE card_progress ADD COLUMN last_rating TEXT;

ALTER TABLE daily_statistics ADD COLUMN unique_cards INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_statistics ADD COLUMN skipped_answers INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_statistics ADD COLUMN study_sessions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_statistics ADD COLUMN completed_sessions INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_card_progress_due ON card_progress(next_review_at, status);
CREATE INDEX IF NOT EXISTS idx_card_progress_card_id ON card_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at_desc ON study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_items_session_position ON study_session_items(session_id, position);
CREATE INDEX IF NOT EXISTS idx_session_items_status ON study_session_items(session_id, status);
CREATE INDEX IF NOT EXISTS idx_review_logs_session_id ON review_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_reviewed ON review_logs(card_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_date ON daily_statistics(study_date DESC);
`;

export const phaseThreeStudyMigration: DatabaseMigration = {
  version: 3,
  name: 'phase-three-study',
  async up(database) {
    await database.execAsync(STUDY_SCHEMA);
  },
};
