
// This file is now just a proxy to maintain backward compatibility
// It exports functionality from the new modular structure
import { useSyncActions } from './sync';

export function useUuidSynchronization(props: any) {
  return useSyncActions(props);
}

// Also export these for backward compatibility
export const forceSyncToCloud = (props: any) => {
  const { forceSyncToCloud: syncFn } = useSyncActions(props);
  return syncFn;
};

export const checkSyncStatus = (props: any) => {
  const { checkSyncStatus: checkFn } = useSyncActions(props);
  return checkFn;
};
