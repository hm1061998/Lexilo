export const BACKUP_FORMAT = 'lexilo-backup' as const;
export const BACKUP_VERSION = 1;
export interface LexiloBackup {
  format: typeof BACKUP_FORMAT;
  backupVersion: number;
  databaseVersion: number;
  createdAt: number;
  checksum: string;
  collections: Record<string, unknown[]>;
  settings: Record<string, string | null>;
}
