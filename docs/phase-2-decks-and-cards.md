# Phase 2 — Decks and cards

## Data flow

`Screen → Form → mutation hook → repository/service → SQLite transaction → sync_queue → query invalidation → UI`.

Screens never execute SQL. They consume query/mutation hooks. Repositories receive the database instance from `useSQLiteContext`; they never open a second connection.

## Transaction boundaries

- Deck/card create and update include tag relations and queue records.
- Card creation also creates `card_progress` in status `new`.
- Duplicate deck includes the deck, cards, tags, fresh progress and queue items.
- CSV import uses one exclusive transaction for all accepted rows.
- Tag deletion removes both relationship sets before deleting the tag.

## Sync queue

Pending operations are compacted per entity: create+update remains create with the latest payload, update+update remains one update, update+delete becomes delete, and create+delete removes the pending queue item. No backend push exists in Phase 2.

## Soft delete

Deleting a deck soft-deletes its cards in the same transaction and creates only the deck delete operation; the future server can cascade it. Deleting a previously synced card keeps progress/history and sets `deleted_at`. A never-synced card is physically removed with its create queue item; foreign-key cascade removes its tag relationships and progress.

## Duplicate deck

Every copied entity gets a new UUID. Content and tag relations are copied, while review logs and learning history are not. Every copied card receives fresh `new` progress.

## Import/export

CSV parsing is a UI-independent state machine supporting quoted commas, escaped quotes and multiline fields. Files are limited to 10 MB and 10,000 rows. Preview separates valid rows and errors. Duplicate strategies are skip, create or update. Export removes IDs, sync metadata and learning history, then writes a versioned JSON file to cache and opens the native share sheet when supported.

## Migration decision

Migration 1 remains immutable. Migration 2 adds Phase 2 indexes and a case-insensitive unique tag-name index without rebuilding existing tables.
