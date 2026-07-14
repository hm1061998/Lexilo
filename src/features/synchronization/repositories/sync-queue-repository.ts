export type SyncEntityType =
  | 'deck'
  | 'card'
  | 'tag'
  | 'deck_tag'
  | 'card_tag'
  | 'card_progress'
  | 'study_session'
  | 'review_log'
  | 'daily_statistics';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface EnqueueSyncInput {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload?: unknown;
}

export interface SyncQueueRepository {
  enqueue(input: EnqueueSyncInput): Promise<void>;
  removeByEntity(entityType: SyncEntityType, entityId: string): Promise<void>;
}
