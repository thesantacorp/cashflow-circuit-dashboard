
import { useState, useEffect } from "react";
import { useUuidGeneration } from "./useUuidGeneration";
import { useUuidSynchronization } from "./useUuidSynchronization";
import { useUuidVerification } from "./useUuidVerification";
import { checkSupabaseConnection } from "@/utils/supabaseInit";
import { toast } from "sonner";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local-only' | 'error' | 'unknown'>('unknown');
  const [syncRetryCount, setSyncRetryCount] = useState<number>(0);
  const [tableVerified, setTableVerified] = useState<boolean>(false);
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<number>(0);

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

  // First, check if Supabase is available
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkSupabaseConnection();
        setConnectionVerified(isConnected);
        console.log(`Initial Supabase connection check: ${isConnected ? 'connected' : 'disconnected'}`);
      } catch (error) {
        console.error('Error checking initial Supabase connection:', error);
        setConnectionVerified(false);
      }
    };
    
    checkConnection();
  }, []);

  // Check for saved UUID and email on mount
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      try {
        // First check localStorage to maintain backward compatibility
        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) {
          setUserEmail(savedEmail);
          console.log('Found email in localStorage:', savedEmail);
          
          // Try to fetch from Supabase if we have a connection
          let supabaseUuid = null;
          
          if (connectionVerified) {
            try {
              // First verify table exists
              const { ensureUuidTableExists } = await import('@/utils/supabase/index');
              const exists = await ensureUuidTableExists();
              setTableVerified(exists);
              
              if (exists) {
                const { fetchUserUuid } = await import('@/utils/supabase/index');
                supabaseUuid = await fetchUserUuid(savedEmail);
                console.log('Supabase UUID fetch result:', supabaseUuid);
              }
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
              
              // If we have a connection but couldn't fetch UUID, 
              // this local UUID needs to be synced
              if (connectionVerified && tableVerified) {
                // Don't block the UI, just schedule a sync
                setTimeout(() => {
                  console.log('Scheduling background sync for local UUID');
                  forceSyncToCloud(true).catch(console.error);
                }, 2000);
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
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSavedUuid();
  }, [connectionVerified, tableVerified, forceSyncToCloud]);

  // Periodically check sync status when in local-only mode
  // But don't spam the API - use increasing intervals between checks
  useEffect(() => {
    if (!userUuid || !userEmail) return;
    
    if (syncStatus === 'local-only' && connectionVerified) {
      const now = Date.now();
      const timeSinceLastCheck = now - lastSyncAttempt;
      
      // Only check if it's been at least 60 seconds since last attempt
      // Increase interval after each retry
      const minInterval = Math.min(60000 * (syncRetryCount + 1), 600000); // Max 10 minutes
      
      if (timeSinceLastCheck > minInterval) {
        console.log(`Checking sync status after ${Math.round(timeSinceLastCheck/1000)}s`);
        setLastSyncAttempt(now);
        
        checkSyncStatus().catch(error => {
          console.error('Error during periodic sync check:', error);
        });
      }
    }
  }, [userUuid, userEmail, syncStatus, connectionVerified, lastSyncAttempt, syncRetryCount, checkSyncStatus]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is now online, checking connection...');
      checkSupabaseConnection().then(isConnected => {
        setConnectionVerified(isConnected);
        if (isConnected && userUuid && userEmail && syncStatus === 'local-only') {
          console.log('Connection restored, checking sync status...');
          checkSyncStatus().catch(console.error);
        }
      });
    };
    
    const handleOffline = () => {
      console.log('App is now offline');
      setConnectionVerified(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userUuid, userEmail, syncStatus, checkSyncStatus]);

  // Return the public API from the hook
  return {
    userUuid,
    userEmail,
    isLoading,
    syncStatus,
    connectionVerified,
    tableVerified,
    generateUserUuid,
    checkUuidExists,
    getUserEmail,
    forceSyncToCloud,
    checkSyncStatus
  };
}
