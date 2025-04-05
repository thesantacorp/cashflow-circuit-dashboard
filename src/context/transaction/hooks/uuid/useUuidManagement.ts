
import { useState, useEffect } from "react";
import { useUuidGeneration } from "./useUuidGeneration";
import { useUuidSynchronization } from "./useUuidSynchronization";
import { useUuidVerification } from "./useUuidVerification";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local-only' | 'unknown'>('unknown');
  const [syncRetryCount, setSyncRetryCount] = useState<number>(0);
  const [tableVerified, setTableVerified] = useState<boolean>(false);
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);

  // Import functionality from sub-hooks
  const { generateUserUuid } = useUuidGeneration({
    setUserUuid,
    setUserEmail,
    setSyncStatus,
    userUuid,
    tableVerified,
    setTableVerified,
    connectionVerified
  });

  const { forceSyncToCloud, checkSyncStatus } = useUuidSynchronization({
    userUuid,
    userEmail,
    setSyncStatus,
    syncRetryCount,
    setSyncRetryCount,
    tableVerified,
    setTableVerified,
    connectionVerified,
    setConnectionVerified
  });

  const { checkUuidExists, getUserEmail } = useUuidVerification({
    userUuid,
    userEmail
  });

  // Check for saved UUID and email on mount
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      try {
        // First verify that the table exists
        if (!tableVerified && connectionVerified) {
          try {
            const { ensureUuidTableExists } = await import('@/utils/supabase/index');
            const exists = await ensureUuidTableExists();
            setTableVerified(exists);
            console.log('UUID table exists or created:', exists);
            
            if (!exists) {
              console.warn("UUID table does not exist or cannot be created");
            }
          } catch (tableError) {
            console.error("Error verifying/creating UUID table:", tableError);
          }
        }
        
        // First check localStorage to maintain backward compatibility
        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) {
          setUserEmail(savedEmail);
          console.log('Found email in localStorage:', savedEmail);
          
          // Try to fetch from Supabase first
          let supabaseUuid = null;
          
          if (tableVerified) {
            try {
              const { fetchUserUuid } = await import('@/utils/supabase/index');
              supabaseUuid = await fetchUserUuid(savedEmail);
              console.log('Supabase UUID fetch result:', supabaseUuid);
            } catch (fetchError) {
              console.error('Error fetching UUID from Supabase:', fetchError);
            }
          }
          
          if (supabaseUuid) {
            console.log(`Retrieved UUID from Supabase for ${savedEmail}`);
            setUserUuid(supabaseUuid);
            setSyncStatus('synced');
            // Update localStorage with the Supabase UUID
            localStorage.setItem("userUuid", supabaseUuid);
          } else {
            // Fall back to localStorage UUID if no Supabase UUID
            const localUuid = localStorage.getItem("userUuid");
            if (localUuid) {
              console.log(`Using local UUID for ${savedEmail}:`, localUuid);
              setUserUuid(localUuid);
              setSyncStatus('local-only');
              
              // If table exists, try to migrate localStorage UUID to Supabase immediately
              if (tableVerified) {
                try {
                  console.log(`Attempting to sync local UUID ${localUuid} to Supabase for ${savedEmail}`);
                  await forceSyncToCloud(true);
                } catch (syncError) {
                  console.error('Error during initial UUID sync to Supabase:', syncError);
                }
              }
            }
          }
        } else {
          // No saved email, check if we have a UUID in localStorage
          const localUuid = localStorage.getItem("userUuid");
          if (localUuid) {
            console.log('Found UUID in localStorage but no email');
            setUserUuid(localUuid);
            setSyncStatus('local-only');
          }
        }
      } catch (error) {
        console.error("Error checking saved UUID:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSavedUuid();
  }, [tableVerified, connectionVerified, forceSyncToCloud]);

  // Return the public API from the hook
  return {
    userUuid,
    userEmail,
    isLoading,
    syncStatus,
    generateUserUuid,
    checkUuidExists,
    getUserEmail,
    tableVerified,
    forceSyncToCloud,
    checkSyncStatus
  };
}
