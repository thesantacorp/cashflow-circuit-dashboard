
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to provide authentication state and functionality for transactions
 */
export const useTransactionAuth = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [syncNeeded, setSyncNeeded] = useState(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user && pendingSyncCount > 0) {
        setSyncNeeded(true);
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, pendingSyncCount]);

  return {
    user,
    isOnline,
    pendingSyncCount,
    setPendingSyncCount,
    syncNeeded,
    setSyncNeeded
  };
};
