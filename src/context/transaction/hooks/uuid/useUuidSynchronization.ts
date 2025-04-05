
import { useCallback } from "react";
import { toast } from "sonner";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";
import { syncQueue } from "@/utils/supabaseInit";

const SYNC_TIMEOUT = 8000; // Lower the timeout to improve user experience

interface UseUuidSynchronizationProps {
  userUuid: string | null;
  userEmail: string | null;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'syncing' | 'local-only' | 'error' | 'unknown'>>;
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
      
      // Update sync status to indicate syncing is in progress
      setSyncStatus('syncing');
      
      if (!silent) {
        toast.loading("Syncing to cloud...", { id: "force-sync" });
      }
      
      // Set up a timeout for the sync operation
      let syncComplete = false;
      const timeoutPromise = new Promise<boolean>(resolve => {
        setTimeout(() => {
          if (!syncComplete) {
            console.warn("Sync operation timed out");
            // Add to sync queue if timeout occurs
            syncQueue.add('syncUuid', { email: userEmail, uuid: userUuid });
            if (!silent) {
              toast.warning("Sync operation timed out", { 
                id: "force-sync",
                description: "Will retry in background"
              });
            }
            resolve(false);
          }
        }, SYNC_TIMEOUT);
      });
      
      const syncPromise = new Promise<boolean>(async (resolve) => {
        try {
          // Verify Supabase connection
          if (!connectionVerified) {
            const verification = await verifySupabaseSetup();
            setConnectionVerified(verification.connected);
            setTableVerified(verification.tableExists);
            
            if (!verification.connected) {
              if (!silent) {
                toast.error("Cannot connect to cloud database", { 
                  id: "force-sync",
                  description: "Your data will be stored locally"
                });
              }
              setSyncStatus('local-only');
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
              if (!silent) {
                toast.error("Could not verify database table", { id: "force-sync" });
              }
              setSyncStatus('error');
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
            setSyncStatus('error');
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
              if (!silent) {
                toast.success("User ID is already synced to the cloud", { id: "force-sync" });
              }
              resolve(true);
              return;
            }
          } catch (verifyError) {
            console.error('Error verifying UUID existence:', verifyError);
          }
          
          // If not, try to store it
          try {
            console.log(`Attempting to sync UUID to Supabase`);
            const { storeUserUuid } = await import('@/utils/supabase/index');
            const success = await storeUserUuid(userEmail, userUuid);
            
            if (success) {
              console.log('UUID successfully synced to Supabase');
              setSyncStatus('synced');
              if (!silent) {
                toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
              }
              resolve(true);
              return;
            } else {
              // Add to sync queue for later retry
              syncQueue.add('syncUuid', { email: userEmail, uuid: userUuid });
              
              console.warn('Failed to sync UUID to Supabase, added to retry queue');
              setSyncStatus('local-only');
              
              if (!silent) {
                toast.warning("Sync temporarily unavailable", { 
                  id: "force-sync",
                  description: "Your ID is stored locally and will be synced later",
                  action: {
                    label: "Retry Now",
                    onClick: () => forceSyncToCloud(false)
                  }
                });
              }
              resolve(false);
            }
          } catch (syncError) {
            console.error(`Error syncing UUID:`, syncError);
            // Add to retry queue
            syncQueue.add('syncUuid', { email: userEmail, uuid: userUuid });
            
            setSyncStatus('error');
            if (!silent) {
              toast.error("Error syncing to cloud", { 
                id: "force-sync",
                description: "Will retry automatically when connection is available"
              });
            }
            resolve(false);
          }
        } catch (error) {
          console.error("Error in sync operation:", error);
          setSyncStatus('error');
          if (!silent) {
            toast.error("Unexpected error during sync", { id: "force-sync" });
          }
          resolve(false);
        }
      });
      
      // Race the sync operation against the timeout
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      // Mark sync as complete to prevent timeout handler from running if it hasn't yet
      syncComplete = true;
      
      return result;
    } catch (error) {
      console.error("Error forcing sync to cloud:", error);
      setSyncStatus('error');
      if (!silent) {
        toast.error("Error syncing to cloud", { 
          id: "force-sync",
          description: "Please check your connection and try again"
        });
      }
      return false;
    }
  }, [userUuid, userEmail, tableVerified, connectionVerified, setConnectionVerified, setTableVerified, setSyncStatus]);

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
  }, [userUuid, userEmail, connectionVerified, tableVerified, setConnectionVerified, setTableVerified, setSyncStatus]);

  return { forceSyncToCloud, checkSyncStatus };
}

// For use from other hooks
export const forceSyncToCloud = (props: UseUuidSynchronizationProps) => {
  const { forceSyncToCloud: syncFn } = useUuidSynchronization(props);
  return syncFn;
};

export const checkSyncStatus = (props: UseUuidSynchronizationProps) => {
  const { checkSyncStatus: checkFn } = useUuidSynchronization(props);
  return checkFn;
};
