# Phase 5 — Offline platform, backup and synchronization

## Notification lifecycle

The app never requests notification permission at startup. Enabling reminders from Settings requests permission, persists validated settings, cancels the previous schedule, then creates one weekly schedule per selected day. Notification payloads contain an allow-listed route and the root listener handles cold and warm responses. Android notification and microphone configuration is declared in `app.json`; a development build is required for representative native testing.

## Media

Card media remains URI-based; binary data is never stored as base64 in SQLite. `media_files` records ownership, local/remote URI, size, checksum and lifecycle state. English text-to-speech is available during flashcard study through `expo-speech`. The Expo Audio plugin declares microphone permission for the recording foundation.

## Backup schema and safety

Backups use `format: lexilo-backup`, backup version 1, database version, timestamp, whitelisted collections, non-secret app settings and an FNV-1a integrity checksum over canonical JSON. Tokens and media binary are excluded. Validation rejects malformed format, unsupported versions, missing core collections and checksum mismatch before restore work can begin. Backup history is stored separately and files live in the app document directory.

Restore deliberately remains validation-first. Production restore must additionally create a pre-restore snapshot, import in foreign-key order inside one exclusive transaction, run `PRAGMA foreign_key_check` and roll back on any error before exposing replace-all in UI.

## Network and sync architecture

`NetworkStatusService` provides a single NetInfo abstraction for connectivity, reachability and expensive-network state. `SyncCoordinator` is single-flight, processes at most 50 eligible queue items, locks each item, waits for remote acknowledgement before completion, performs bounded pull pagination, then updates cursors and diagnostic metadata.

Queue operations merge create/update/delete mutations. Phase 5 adds priority, dedupe keys, lock ownership and completion timestamps. Retry uses exponential backoff (`1s, 2s, 4s…`) with ±20% jitter, caps delay at five minutes, honors retry-after and stops after attempt 6 or a permanent error. The development adapter can simulate success, temporary failure and permanent validation failure.

Conflict helpers compare canonical payloads and support local, remote or explicit merged resolution. The schema records versioned conflict payloads without requiring a production backend. It is not a CRDT.

## Security decisions

- All database writes are parameterized; dynamic backup tables come from a compile-time whitelist.
- Backups exclude secure-store credentials and media binary.
- Notification deep links are allow-listed.
- Sync logs contain counts and identifiers, not card contents or tokens.
- Retry is bounded and sync is single-flight.

## Commands

```powershell
pnpm install
pnpm exec expo prebuild
pnpm android
pnpm ios
pnpm exec eas build --profile development --platform android
pnpm typecheck
pnpm lint
pnpm test
pnpm test -- --runInBand
pnpm reset-project
```

## Known limitations

- There is no production backend, authentication, cloud backup, media upload or server push.
- The mock adapter is development/test only and pulled remote records are not yet applied to entity tables.
- Full replace-all restore and pre-restore rollback are not exposed yet; this release provides creation and strict validation first.
- Audio recording metadata/schema and native permission foundation exist, but the recording UI and managed-file copy/cleanup flow are not complete.
- Background sync and notification delivery depend on operating-system limits.
- Scheduled notification content is not dynamically recalculated at trigger time on every platform.
- There is no end-to-end encryption, CRDT, speech-to-text or pronunciation scoring.
