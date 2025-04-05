
import { useCallback } from "react";
import { toast } from "sonner";
import { useSyncUtils } from "./useSyncUtils";
import { useSyncStatus } from "./useSyncStatus";
import { syncQueue } from "@/utils/supabaseInit";
import { SyncBaseProps } from "./types";

export function useSyncActions(props: SyncBaseProps) {
  const { userUuid, userEmail, setSyncStatus } = props;
  const { verifySetup } = useSyncUtils(props);
  const { checkSyncStatus: checkStatus } = useSyncStatus(props);

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
      const SYNC_TIMEOUT = 8000; // Lower the timeout to improve user experience
      
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
          // Verify Supabase connection and table
          const setupResult = await verifySetup();
          if (!setupResult.success) {
            if (!silent) {
              toast.error(setupResult.errorMessage || "Cannot connect to cloud database", { 
                id: "force-sync",
                description: setupResult.errorDescription || "Your data will be stored locally"
              });
            }
            setSyncStatus('local-only');
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
  }, [userUuid, userEmail, setSyncStatus, verifySetup]);

  return { 
    forceSyncToCloud,
    checkSyncStatus: checkStatus
  };
}
