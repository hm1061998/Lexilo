import type { PullPage, PushResult, SyncQueueItem } from '../types/sync.types';
import type { RemoteSyncAdapter } from './remote-sync.adapter';
export class MockRemoteSyncAdapter implements RemoteSyncAdapter {
  private changes: PullPage['changes'] = [];
  async push(item: SyncQueueItem): Promise<PushResult> {
    if ((item.payload as { simulate?: string } | null)?.simulate === 'temporary')
      return { accepted: false, error: 'temporary' };
    if ((item.payload as { simulate?: string } | null)?.simulate === 'permanent')
      return { accepted: false, permanent: true, error: 'validation' };
    return { accepted: true, remoteVersion: Date.now() };
  }
  async pull(cursor: string, limit: number) {
    const offset = Number(cursor) || 0;
    const changes = this.changes.slice(offset, offset + limit);
    return {
      changes,
      cursor: String(offset + changes.length),
      hasMore: offset + changes.length < this.changes.length,
    };
  }
  seed(changes: PullPage['changes']) {
    this.changes = [...changes];
  }
}
