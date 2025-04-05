
import { useCallback } from "react";
import { toast } from "sonner";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";

const SYNC_TIMEOUT = 10000; // 10 seconds timeout for sync operations

interface UseUuidSynchronizationProps {
  userUuid: string | null;
  userEmail: string | null;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'local-only' | 'unknown'>>;
  syncRetryCount: number;
  setSyncRetryCount: React.Dispatch<React.SetStateAction<number>>;
  tableVerified: boolean;
  setTableVerified: React.Dispatch<React.SetStateAction<boolean>>;
  connectionVerified: boolean;
  setConnectionVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useUuidSynchronization({
  userUuid,
  userEmail,
  setSyncStatus,
  syncRetryCount,
  setSyncRetryCount,
  tableVerified,
  setTableVerified,
  connectionVerified,
  setConnectionVerified
}: UseUuidSynchronizationProps) {
  // Force sync the current UUID to Supabase
  const forceSyncToCloud = useCallback(async (silent: boolean = false): Promise<boolean> => {
    if (!userUuid || !userEmail) {
      if (!silent) toast.error("No User ID or email to sync");
      return false;
    }

    try {
      console.log(`Force syncing UUID ${userUuid} for ${userEmail} to cloud...`);
      
      if (!silent) {
        toast.loading("Syncing to cloud...", { id: "force-sync" });
      }
      
      // Set up a timeout for the sync operation
      let timeoutId: number | null = null;
      const syncPromise = new Promise<boolean>(async (resolve) => {
        try {
          // Verify Supabase connection
          if (!connectionVerified) {
            const verification = await verifySupabaseSetup();
            setConnectionVerified(verification.connected);
            setTableVerified(verification.tableExists);
            
            if (!verification.connected) {
              if (!silent) toast.error("Cannot connect to cloud database", { id: "force-sync" });
              resolve(false);
              return;
            }
          }
          
          // Verify table exists before attempting sync
          let tableExists = tableVerified;
          if (!tableExists) {
            try {
              const { ensureUuidTableExists } = await import('@/utils/supabase/index');
              tableExists = await ensureUuidTableExists();
              setTableVerified(tableExists);
            } catch (tableError) {
              console.error('Error ensuring table exists during force sync:', tableError);
              if (!silent) toast.error("Could not verify database table", { id: "force-sync" });
              resolve(false);
              return;
            }
          }
          
          if (!tableExists) {
            if (!silent) {
              toast.error("Database table doesn't exist", {
                id: "force-sync",
                description: "Please check your Supabase project"
              });
            }
            resolve(false);
            return;
          }
          
          // First check if UUID is already in Supabase
          let exists = false;
          try {
            const { verifyUuidInSupabase } = await import('@/utils/supabase/index');
            exists = await verifyUuidInSupabase(userEmail, userUuid);
            console.log(`UUID already exists in Supabase: ${exists}`);
            
            if (exists) {
              setSyncStatus('synced');
              if (!silent) toast.success("User ID is already synced to the cloud", { id: "force-sync" });
              resolve(true);
              return;
            }
          } catch (verifyError) {
            console.error('Error verifying UUID existence:', verifyError);
          }
          
          // If not, try to store it with limited retries
          let success = false;
          let attempts = 0;
          const maxAttempts = 2; // Limit retries to avoid infinite loops
          
          while (!success && attempts < maxAttempts) {
            try {
              console.log(`Attempt ${attempts + 1}/${maxAttempts} to sync UUID to Supabase`);
              const { storeUserUuid } = await import('@/utils/supabase/index');
              success = await storeUserUuid(userEmail, userUuid);
              
              if (success) {
                console.log('UUID successfully synced to Supabase');
                setSyncStatus('synced');
                if (!silent) toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
                resolve(true);
                return;
              }
            } catch (syncError) {
              console.error(`Error on sync attempt ${attempts + 1}:`, syncError);
            }
            
            if (!success && attempts < maxAttempts - 1) {
              const delay = 1000;
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            attempts++;
          }
          
          setSyncRetryCount(prevCount => {
            // Limit retry count to prevent infinite loops
            return prevCount < 5 ? prevCount + 1 : prevCount;
          });
          
          if (!success) {
            console.error('Failed to sync UUID to Supabase after multiple attempts');
            if (!silent) toast.error("Failed to sync User ID to the cloud", { id: "force-sync" });
            setSyncStatus('local-only');
            
            // Schedule just one more retry attempt later, with exponential backoff
            if (syncRetryCount < 3) {
              const retryDelay = 5000 * Math.pow(2, syncRetryCount);
              console.log(`Scheduling another retry in ${retryDelay}ms`);
              setTimeout(() => forceSyncToCloud(true), retryDelay);
            }
            
            resolve(false);
            return;
          }
          
          resolve(success);
        } catch (error) {
          console.error("Error in sync operation:", error);
          resolve(false);
        }
      });
      
      // Set up timeout mechanism
      const timeoutPromise = new Promise<boolean>((resolve) => {
        timeoutId = window.setTimeout(() => {
          console.error("Sync operation timed out");
          if (!silent) toast.error("Sync operation timed out", { id: "force-sync" });
          resolve(false);
        }, SYNC_TIMEOUT);
      });
      
      // Race the sync operation against the timeout
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      // Clear timeout if it hasn't fired yet
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      return result;
    } catch (error) {
      console.error("Error forcing sync to cloud:", error);
      if (!silent) toast.error("Error syncing to cloud", { id: "force-sync" });
      return false;
    }
  }, [userUuid, userEmail, tableVerified, connectionVerified, syncRetryCount, setConnectionVerified, setTableVerified, setSyncStatus, setSyncRetryCount]);

  // Check sync status with timeout
  const checkSyncStatus = useCallback(async (): Promise<boolean> => {
    if (!userUuid || !userEmail) return false;
    
    try {
      console.log(`Checking sync status for UUID ${userUuid} and email ${userEmail}...`);
      
      // Set up timeout mechanism
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Sync status check timed out')), 8000);
      });
      
      try {
        const statusCheck = Promise.resolve().then(async () => {
          // First verify connection and table
          if (!connectionVerified || !tableVerified) {
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
          
          // If not synced, attempt to sync now (but don't wait for result)
          if (!isSynced) {
            console.log('UUID not synced to Supabase, attempting sync now...');
            forceSyncToCloud(true).catch(e => console.error("Background sync failed:", e));
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
  }, [userUuid, userEmail, connectionVerified, tableVerified, forceSyncToCloud, setConnectionVerified, setTableVerified, setSyncStatus]);

  return { forceSyncToCloud, checkSyncStatus };
}

// For use from other hooks that need these functions
export const forceSyncToCloud = (props: UseUuidSynchronizationProps) => {
  const { forceSyncToCloud: syncFn } = useUuidSynchronization(props);
  return syncFn;
};

export const checkSyncStatus = (props: UseUuidSynchronizationProps) => {
  const { checkSyncStatus: checkFn } = useUuidSynchronization(props);
  return checkFn;
};
