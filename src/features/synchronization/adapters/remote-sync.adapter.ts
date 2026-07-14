import type{PullPage,PushResult,SyncQueueItem}from'../types/sync.types';
export interface RemoteSyncAdapter{push(item:SyncQueueItem):Promise<PushResult>;pull(cursor:string,limit:number):Promise<PullPage>}
