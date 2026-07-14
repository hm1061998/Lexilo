import type { DatabaseMigration } from './types';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS notification_settings (id TEXT PRIMARY KEY NOT NULL,user_id TEXT,enabled INTEGER NOT NULL DEFAULT 0,reminder_hour INTEGER NOT NULL DEFAULT 20,reminder_minute INTEGER NOT NULL DEFAULT 0,reminder_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',remind_only_when_due INTEGER NOT NULL DEFAULT 1,minimum_due_cards INTEGER NOT NULL DEFAULT 1,timezone_id TEXT,last_scheduled_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,sync_status TEXT NOT NULL DEFAULT 'pending',server_version INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS media_files (id TEXT PRIMARY KEY NOT NULL,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,media_type TEXT NOT NULL,local_uri TEXT NOT NULL,remote_uri TEXT,mime_type TEXT,original_filename TEXT,file_size INTEGER,duration_ms INTEGER,checksum TEXT,status TEXT NOT NULL DEFAULT 'local',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,deleted_at INTEGER,sync_status TEXT NOT NULL DEFAULT 'pending',server_version INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS backup_history (id TEXT PRIMARY KEY NOT NULL,backup_type TEXT NOT NULL,file_uri TEXT,file_name TEXT,file_size INTEGER,backup_version INTEGER NOT NULL,database_version INTEGER NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,completed_at INTEGER,error_message TEXT);
CREATE TABLE IF NOT EXISTS sync_logs (id TEXT PRIMARY KEY NOT NULL,sync_session_id TEXT NOT NULL,direction TEXT NOT NULL,entity_type TEXT,entity_id TEXT,operation TEXT,status TEXT NOT NULL,attempt INTEGER NOT NULL DEFAULT 1,error_code TEXT,error_message TEXT,metadata_json TEXT,started_at INTEGER NOT NULL,completed_at INTEGER);
CREATE TABLE IF NOT EXISTS sync_conflicts (id TEXT PRIMARY KEY NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,local_version INTEGER NOT NULL,remote_version INTEGER NOT NULL,local_payload TEXT NOT NULL,remote_payload TEXT NOT NULL,conflict_type TEXT NOT NULL,resolution_status TEXT NOT NULL DEFAULT 'pending',resolved_payload TEXT,created_at INTEGER NOT NULL,resolved_at INTEGER);
ALTER TABLE sync_queue ADD COLUMN priority INTEGER NOT NULL DEFAULT 100;
ALTER TABLE sync_queue ADD COLUMN dedupe_key TEXT;
ALTER TABLE sync_queue ADD COLUMN locked_at INTEGER;
ALTER TABLE sync_queue ADD COLUMN lock_owner TEXT;
ALTER TABLE sync_queue ADD COLUMN completed_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media_files(owner_type,owner_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media_files(status,sync_status);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_session ON sync_logs(sync_session_id,started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts(resolution_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_processing ON sync_queue(status,priority,next_retry_at,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_dedupe ON sync_queue(dedupe_key) WHERE dedupe_key IS NOT NULL AND status IN ('pending','processing','failed');
INSERT OR IGNORE INTO notification_settings(id,created_at,updated_at) VALUES('local-default-notification-settings',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000);
INSERT OR IGNORE INTO sync_metadata(key,value) VALUES('sync_enabled','true'),('auto_sync_enabled','true'),('last_pull_cursor','0');
`;
export const phaseFiveOfflinePlatformMigration:DatabaseMigration={version:5,name:'phase-five-offline-platform',async up(database){await database.execAsync(SCHEMA);}};
