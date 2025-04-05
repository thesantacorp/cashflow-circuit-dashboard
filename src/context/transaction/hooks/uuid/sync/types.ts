
export interface SyncBaseProps {
  userUuid: string | null;
  userEmail: string | null;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'syncing' | 'local-only' | 'error' | 'unknown'>>;
  syncRetryCount?: number;
  setSyncRetryCount?: React.Dispatch<React.SetStateAction<number>>;
  tableVerified: boolean;
  setTableVerified: React.Dispatch<React.SetStateAction<boolean>>;
  connectionVerified: boolean;
  setConnectionVerified: React.Dispatch<React.SetStateAction<boolean>>;
}
