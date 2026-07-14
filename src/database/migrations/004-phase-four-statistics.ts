import type { DatabaseMigration } from './types';

const STATISTICS_SCHEMA = `
CREATE TABLE IF NOT EXISTS learning_goals (
  id TEXT PRIMARY KEY NOT NULL, daily_card_goal INTEGER NOT NULL DEFAULT 20,
  daily_minutes_goal INTEGER NOT NULL DEFAULT 15, weekly_days_goal INTEGER NOT NULL DEFAULT 5,
  daily_new_cards_goal INTEGER NOT NULL DEFAULT 10, daily_review_cards_goal INTEGER NOT NULL DEFAULT 50,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, sync_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS goal_completion_logs (
  id TEXT PRIMARY KEY NOT NULL, goal_id TEXT NOT NULL, study_date TEXT NOT NULL,
  cards_completed INTEGER NOT NULL DEFAULT 0, minutes_completed INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  UNIQUE(goal_id, study_date), FOREIGN KEY(goal_id) REFERENCES learning_goals(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS statistics_metadata (
  key TEXT PRIMARY KEY NOT NULL, value TEXT, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_goal_completion_date ON goal_completion_logs(study_date DESC);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_correct ON review_logs(reviewed_at, is_correct);
CREATE INDEX IF NOT EXISTS idx_sessions_status_completed ON study_sessions(status, completed_at DESC);
INSERT OR IGNORE INTO learning_goals(id,created_at,updated_at)
VALUES('local-default-learning-goal', CAST(strftime('%s','now') AS INTEGER)*1000, CAST(strftime('%s','now') AS INTEGER)*1000);
`;

export const phaseFourStatisticsMigration: DatabaseMigration = {
  version: 4,
  name: 'phase-four-statistics',
  async up(database) { await database.execAsync(STATISTICS_SCHEMA); },
};
