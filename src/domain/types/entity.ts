export type SyncStatus = 'pending' | 'synced' | 'failed';

export type EntityTimestamps = {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncableEntity = EntityTimestamps & {
  id: string;
  syncStatus: SyncStatus;
};
