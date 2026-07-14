import type { DatabaseMigration } from './types';

const PHASE_TWO_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_nocase ON tags(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_decks_name ON decks(name);
CREATE INDEX IF NOT EXISTS idx_decks_updated_at ON decks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_decks_deleted_at ON decks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cards_front_text ON cards(front_text);
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON cards(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deck_tags_tag_id ON deck_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);
`;

export const phaseTwoIndexesMigration: DatabaseMigration = {
  version: 2,
  name: 'phase-two-indexes',
  async up(database) {
    await database.execAsync(PHASE_TWO_INDEXES);
  },
};
