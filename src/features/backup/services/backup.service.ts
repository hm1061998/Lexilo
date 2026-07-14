import { DATABASE_VERSION } from '@/database/database';
import { BackupCreationError } from '@/shared/errors/app-error';
import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { BACKUP_FORMAT, BACKUP_VERSION, type LexiloBackup } from '../types/backup.types';
import { checksumText, stableStringify, validateBackup } from './backup-validator.service';

const TABLES = [
  'decks',
  'cards',
  'tags',
  'deck_tags',
  'card_tags',
  'card_progress',
  'study_sessions',
  'study_session_decks',
  'study_session_items',
  'review_logs',
  'daily_statistics',
  'learning_goals',
  'goal_completion_logs',
  'notification_settings',
  'media_files',
] as const;
export class BackupService {
  constructor(private db: SQLiteDatabase) {}
  async create(type: 'manual' | 'automatic' | 'pre_restore' = 'manual') {
    const id = randomUUID(),
      createdAt = Date.now();
    try {
      await this.db.runAsync(
        `INSERT INTO backup_history(id,backup_type,backup_version,database_version,status,created_at) VALUES(?,?,?,?, 'creating',?)`,
        [id, type, BACKUP_VERSION, DATABASE_VERSION, createdAt],
      );
      const collections: Record<string, unknown[]> = {};
      for (const table of TABLES)
        collections[table] = await this.db.getAllAsync(`SELECT * FROM ${table}`);
      const settingsRows = await this.db.getAllAsync<{ key: string; value: string | null }>(
        'SELECT key,value FROM app_settings',
      );
      const backup: LexiloBackup = {
        format: BACKUP_FORMAT,
        backupVersion: BACKUP_VERSION,
        databaseVersion: DATABASE_VERSION,
        createdAt,
        checksum: '',
        collections,
        settings: Object.fromEntries(settingsRows.map((x) => [x.key, x.value])),
      };
      backup.checksum = checksumText(stableStringify(backup));
      const file = new File(
        Paths.document,
        `lexilo-backup-${new Date(createdAt).toISOString().slice(0, 10)}-${id.slice(0, 8)}.json`,
      );
      file.create();
      file.write(JSON.stringify(backup));
      await this.db.runAsync(
        `UPDATE backup_history SET status='completed',file_uri=?,file_name=?,file_size=?,completed_at=? WHERE id=?`,
        [file.uri, file.name, file.size, Date.now(), id],
      );
      return { uri: file.uri, name: file.name, size: file.size, backup };
    } catch (cause) {
      await this.db.runAsync(
        `UPDATE backup_history SET status='failed',error_message=?,completed_at=? WHERE id=?`,
        ['Không thể tạo bản sao lưu.', Date.now(), id],
      );
      throw new BackupCreationError('Không thể tạo bản sao lưu.', { cause });
    }
  }
  validate(text: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new BackupCreationError('Tệp sao lưu không phải JSON hợp lệ.');
    }
    return validateBackup(parsed);
  }
  async history() {
    return this.db.getAllAsync<{
      id: string;
      file_name: string | null;
      file_uri: string | null;
      file_size: number | null;
      status: string;
      created_at: number;
    }>(
      'SELECT id,file_name,file_uri,file_size,status,created_at FROM backup_history ORDER BY created_at DESC LIMIT 20',
    );
  }
}
