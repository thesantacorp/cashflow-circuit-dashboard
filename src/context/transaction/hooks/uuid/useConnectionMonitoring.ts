
import { useEffect } from "react";
import { checkSupabaseConnection } from "@/utils/supabaseInit";

interface UseConnectionMonitoringProps {
  userUuid: string | null;
  userEmail: string | null;
  syncStatus: 'synced' | 'syncing' | 'local-only' | 'error' | 'unknown';
  connectionVerified: boolean;
  setConnectionVerified: React.Dispatch<React.SetStateAction<boolean>>;
  checkSyncStatus: () => Promise<boolean>;
}

export function useConnectionMonitoring({
  userUuid,
  userEmail,
  syncStatus,
  connectionVerified,
  setConnectionVerified,
  checkSyncStatus
}: UseConnectionMonitoringProps) {
  
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
  }, [userUuid, userEmail, syncStatus, checkSyncStatus, setConnectionVerified]);
  
  return null;
}
