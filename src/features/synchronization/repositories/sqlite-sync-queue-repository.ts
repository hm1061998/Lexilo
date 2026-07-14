import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { EnqueueSyncInput, SyncQueueRepository } from './sync-queue-repository';

interface QueueRow {
  id: string;
  operation: 'create' | 'update' | 'delete';
}

export function mergeSyncOperations(
  existing: QueueRow['operation'] | null,
  incoming: QueueRow['operation'],
): QueueRow['operation'] | null {
  if (!existing) return incoming;
  if (existing === 'create' && incoming === 'delete') return null;
  if (existing === 'create') return 'create';
  if (incoming === 'delete') return 'delete';
  return 'update';
}

export class SQLiteSyncQueueRepository implements SyncQueueRepository {
  constructor(private readonly database: SQLiteDatabase) {}

  async enqueue(input: EnqueueSyncInput): Promise<void> {
    const existing = await this.database.getFirstAsync<QueueRow>(
      `SELECT id, operation FROM sync_queue
       WHERE entity_type = ? AND entity_id = ? AND status = 'pending'
       ORDER BY created_at ASC LIMIT 1`,
      [input.entityType, input.entityId],
    );
    const operation = mergeSyncOperations(existing?.operation ?? null, input.operation);
    if (!operation) {
      await this.removeByEntity(input.entityType, input.entityId);
      return;
    }
    const payload = input.payload === undefined ? null : JSON.stringify(input.payload);
    if (existing) {
      await this.database.runAsync(
        `UPDATE sync_queue SET operation = ?, payload = ?, retry_count = 0,
         next_retry_at = NULL, error_message = NULL WHERE id = ?`,
        [operation, payload, existing.id],
      );
      return;
    }
    await this.database.runAsync(
      `INSERT INTO sync_queue
       (id, entity_type, entity_id, operation, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [randomUUID(), input.entityType, input.entityId, operation, payload, Date.now()],
    );
  }

  async removeByEntity(
    entityType: EnqueueSyncInput['entityType'],
    entityId: string,
  ): Promise<void> {
    await this.database.runAsync(
      `DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ? AND status = 'pending'`,
      [entityType, entityId],
    );
  }
}
