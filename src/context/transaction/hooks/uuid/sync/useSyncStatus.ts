
import { useCallback } from "react";
import { syncQueue } from "@/utils/supabaseInit";
import { SyncBaseProps } from "./types";

export function useSyncStatus({ 
  userUuid, 
  userEmail, 
  setSyncStatus,
  connectionVerified,
  tableVerified,
  setConnectionVerified,
  setTableVerified
}: SyncBaseProps) {
  
  // Check sync status with timeout
  const checkSyncStatus = useCallback(async (): Promise<boolean> => {
    if (!userUuid || !userEmail) return false;
    
    try {
      console.log(`Checking sync status for UUID ${userUuid} and email ${userEmail}...`);
      
      // Set up timeout mechanism
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Sync status check timed out')), 5000);
      });
      
      try {
        const statusCheck = Promise.resolve().then(async () => {
          // First verify connection and table
          if (!connectionVerified || !tableVerified) {
            const { verifySupabaseSetup } = await import('@/utils/verification');
            const verification = await verifySupabaseSetup();
            setConnectionVerified(verification.connected);
            setTableVerified(verification.tableExists);
            
            if (!verification.connected) {
              console.log('No connection to Supabase, sync status is local-only');
              setSyncStatus('local-only');
              return false;
            }
            
            if (!verification.tableExists) {
              console.log('Table does not exist, sync status is local-only');
              setSyncStatus('local-only');
              return false;
            }
          }
          
          const { verifyUuidInSupabase } = await import('@/utils/supabase/index');
          const isSynced = await verifyUuidInSupabase(userEmail, userUuid);
          console.log(`Sync status check result: ${isSynced ? 'synced' : 'local-only'}`);
          
          setSyncStatus(isSynced ? 'synced' : 'local-only');
          
          // If not synced, add to the sync queue (but don't block UI)
          if (!isSynced) {
            console.log('UUID not synced to Supabase, adding to sync queue...');
            syncQueue.add('syncUuid', { email: userEmail, uuid: userUuid });
          }
          
          return isSynced;
        });
        
        // Race against timeout
        return await Promise.race([statusCheck, timeoutPromise]);
      } catch (timeoutError) {
        console.warn("Sync status check timed out:", timeoutError);
        // Don't change sync status on timeout to avoid flashing UI states
        return false;
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
      return false;
    }
  }, [
    userUuid,
    userEmail,
    connectionVerified,
    tableVerified,
    setConnectionVerified,
    setTableVerified,
    setSyncStatus
  ]);

  return { checkSyncStatus };
}
