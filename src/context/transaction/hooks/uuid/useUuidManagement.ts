
import { useState, useEffect } from "react";
import { useUuidGeneration } from "./useUuidGeneration";
import { useUuidSynchronization } from "./useUuidSynchronization";
import { useUuidVerification } from "./useUuidVerification";
import { useUuidPersistence } from "./useUuidPersistence";
import { useConnectionMonitoring } from "./useConnectionMonitoring";
import { checkSupabaseConnection } from "@/utils/supabaseInit";

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

  // Use our new hooks
  const { loadSavedUuid } = useUuidPersistence({
    setUserEmail,
    setUserUuid,
    setSyncStatus,
    connectionVerified,
    tableVerified,
    setTableVerified,
    forceSyncToCloud
  });

  useConnectionMonitoring({
    userUuid,
    userEmail,
    syncStatus,
    connectionVerified,
    setConnectionVerified,
    checkSyncStatus
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
    const initializeUuid = async () => {
      setIsLoading(true);
      await loadSavedUuid();
      setIsLoading(false);
    };
    
    initializeUuid();
  }, [connectionVerified, tableVerified]);

  // Periodically check sync status when in local-only mode
  useEffect(() => {
    if (!userUuid || !userEmail) return;
    
    if (syncStatus === 'local-only' && connectionVerified) {
      const now = Date.now();
      const timeSinceLastCheck = now - lastSyncAttempt;
      
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
