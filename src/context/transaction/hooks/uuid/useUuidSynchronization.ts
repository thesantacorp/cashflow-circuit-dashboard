
import { useCallback } from "react";
import { toast } from "sonner";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";

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
      
      // Verify Supabase connection
      if (!connectionVerified) {
        const verification = await verifySupabaseSetup();
        setConnectionVerified(verification.connected);
        setTableVerified(verification.tableExists);
        
        if (!verification.connected) {
          if (!silent) toast.error("Cannot connect to cloud database", { id: "force-sync" });
          return false;
        }
        
        // Check if we have write access
        if (verification.connected && !verification.hasWriteAccess) {
          console.warn("RLS policy prevents writing to database");
          if (!silent) {
            toast.warning("Read-only database access", { 
              id: "force-sync", 
              description: "Incomplete permissions prevent cloud sync. Using local storage." 
            });
          }
          setSyncStatus('local-only');
          return false;
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
          return false;
        }
      }
      
      if (!tableExists) {
        if (!silent) {
          toast.error("Database table doesn't exist", {
            id: "force-sync",
            description: "Please check your Supabase project"
          });
        }
        return false;
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
          return true;
        }
      } catch (verifyError) {
        console.error('Error verifying UUID existence:', verifyError);
      }
      
      // If not, try to store it with retries
      let success = false;
      let attempts = 0;
      const maxAttempts = 2; // Reducing max attempts to avoid excessive failures with RLS
      
      while (!success && attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1}/${maxAttempts} to sync UUID to Supabase`);
          const { storeUserUuid } = await import('@/utils/supabase/index');
          success = await storeUserUuid(userEmail, userUuid);
          
          if (success) {
            console.log('UUID successfully synced to Supabase');
            setSyncStatus('synced');
            if (!silent) toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
            return true;
          }
        } catch (syncError: any) {
          console.error(`Error on sync attempt ${attempts + 1}:`, syncError);
          
          // Check specifically for RLS policy violation
          if (syncError.message && syncError.message.includes('policy')) {
            console.warn('RLS policy prevents writing - stopping retry attempts');
            if (!silent) {
              toast.warning("Database permissions issue", { 
                id: "force-sync",
                description: "Read-only mode active. Data saved locally."
              });
            }
            setSyncStatus('local-only');
            return false;
          }
        }
        
        if (!success && attempts < maxAttempts - 1) {
          const delay = 1000 * (attempts + 1);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        attempts++;
      }
      
      setSyncRetryCount(prevCount => prevCount + 1);
      
      if (!success) {
        console.error('Failed to sync UUID to Supabase after multiple attempts');
        
        if (!silent) {
          if (syncRetryCount >= 2) {
            toast.error("Could not sync to cloud", { 
              id: "force-sync",
              description: "Using local storage only. Check database permissions."
            });
          } else {
            toast.error("Failed to sync User ID to the cloud", { id: "force-sync" });
          }
        }
        
        setSyncStatus('local-only');
        return false;
      }
      
      return success;
    } catch (error) {
      console.error("Error forcing sync to cloud:", error);
      if (!silent) toast.error("Error syncing to cloud", { id: "force-sync" });
      return false;
    }
  }, [userUuid, userEmail, tableVerified, connectionVerified, syncRetryCount, setConnectionVerified, setTableVerified, setSyncStatus, setSyncRetryCount]);

  // Check sync status
  const checkSyncStatus = useCallback(async (forceCheck: boolean = false): Promise<boolean> => {
    if (!userUuid || !userEmail) return false;
    
    try {
      console.log(`Checking sync status for UUID ${userUuid} and email ${userEmail}...`);
      
      // First verify connection and table
      if (!connectionVerified || !tableVerified || forceCheck) {
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
        
        // Update on write access issues
        if (!verification.hasWriteAccess) {
          console.log('No write access to Supabase, marking as local-only');
          setSyncStatus('local-only');
          return false;
        }
      }
      
      const { verifyUuidInSupabase } = await import('@/utils/supabase/index');
      const isSynced = await verifyUuidInSupabase(userEmail, userUuid);
      console.log(`Sync status check result: ${isSynced ? 'synced' : 'local-only'}`);
      
      setSyncStatus(isSynced ? 'synced' : 'local-only');
      
      // Only attempt sync if we haven't reached retry limits
      if (!isSynced && syncRetryCount < 3) {
        console.log('UUID not synced to Supabase, attempting sync now...');
        await forceSyncToCloud(true);
      } else if (!isSynced) {
        console.log('UUID not synced, but reached retry limit. Staying in local-only mode.');
      }
      
      return isSynced;
    } catch (error) {
      console.error("Error checking sync status:", error);
      return false;
    }
  }, [userUuid, userEmail, connectionVerified, tableVerified, forceSyncToCloud, syncRetryCount, setConnectionVerified, setTableVerified, setSyncStatus]);

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
