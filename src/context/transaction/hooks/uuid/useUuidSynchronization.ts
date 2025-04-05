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
            toast.warning("Local storage mode active", { 
              id: "force-sync", 
              description: "Database is read-only. Your data is securely stored locally." 
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
      
      // First attempt to store - if this fails due to RLS, we'll handle it gracefully
      try {
        console.log('Attempting to sync UUID to Supabase');
        const { storeUserUuid } = await import('@/utils/supabase/index');
        const success = await storeUserUuid(userEmail, userUuid);
        
        if (success) {
          console.log('UUID successfully synced to Supabase');
          setSyncStatus('synced');
          if (!silent) toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
          return true;
        }
      } catch (syncError: any) {
        console.error('Error on sync attempt:', syncError);
        
        // Check if this is an RLS policy issue
        const isRlsError = syncError.message && (
          syncError.message.includes('policy') || 
          syncError.message.includes('permission') ||
          syncError.message.includes('403')
        );
        
        if (isRlsError) {
          console.log('Detected RLS policy issue, switching to local-only mode');
          setSyncStatus('local-only');
          
          if (!silent) {
            toast.warning("Read-only database access", { 
              id: "force-sync",
              description: "Using local storage mode due to database permissions" 
            });
          }
          
          // Update the verification status so we remember it's read-only
          const { verifySupabaseSetup } = await import('@/utils/supabaseVerification');
          const verification = await verifySupabaseSetup();
          
          if (verification.hasReadAccess && !verification.hasWriteAccess) {
            // Store this fact so we don't keep trying
            localStorage.setItem("supabaseReadOnly", "true");
          }
          
          return false;
        }
      }
      
      // If we get here, it wasn't a clear RLS issue - try one more time with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        console.log('Final sync attempt...');
        const { storeUserUuid } = await import('@/utils/supabase/index');
        const success = await storeUserUuid(userEmail, userUuid);
        
        if (success) {
          console.log('UUID successfully synced on retry');
          setSyncStatus('synced');
          if (!silent) toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
          return true;
        }
      } catch (retryError) {
        console.error('Error on final sync attempt:', retryError);
      }
      
      // If we've reached here, sync has failed
      setSyncRetryCount(prevCount => prevCount + 1);
      
      if (!silent) {
        toast.error("Could not sync User ID to the cloud", {
          id: "force-sync",
          description: "Your data is securely stored locally"
        });
      }
      
      setSyncStatus('local-only');
      return false;
      
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
      
      // First check if we already know we're in read-only mode
      const isKnownReadOnly = localStorage.getItem("supabaseReadOnly") === "true";
      if (isKnownReadOnly && !forceCheck) {
        console.log('Already know we are in read-only mode, skipping sync check');
        setSyncStatus('local-only');
        return false;
      }
      
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
          localStorage.setItem("supabaseReadOnly", "true");
          setSyncStatus('local-only');
          return false;
        }
      }
      
      const { verifyUuidInSupabase } = await import('@/utils/supabase/index');
      const isSynced = await verifyUuidInSupabase(userEmail, userUuid);
      console.log(`Sync status check result: ${isSynced ? 'synced' : 'local-only'}`);
      
      setSyncStatus(isSynced ? 'synced' : 'local-only');
      
      // Don't attempt sync if we already know we're in read-only mode
      if (!isSynced && !isKnownReadOnly && syncRetryCount < 2) {
        console.log('UUID not synced to Supabase, attempting sync now...');
        await forceSyncToCloud(true);
      } else if (!isSynced) {
        console.log('UUID not synced, but reached retry limit or in read-only mode. Staying in local-only mode.');
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
