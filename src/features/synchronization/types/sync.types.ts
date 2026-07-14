import type { SyncEntityType, SyncOperation } from '../repositories/sync-queue-repository';
export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  retryCount: number;
  priority: number;
}
export interface PushResult {
  accepted: boolean;
  remoteVersion?: number;
  permanent?: boolean;
  error?: string;
}
export interface RemoteChange {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  version: number;
  payload: Record<string, unknown>;
}
export interface PullPage {
  changes: RemoteChange[];
  cursor: string;
  hasMore: boolean;
}
export interface SyncSummary {
  pushed: number;
  pulled: number;
  failed: number;
  conflicts: number;
  startedAt: number;
  completedAt: number;
}
