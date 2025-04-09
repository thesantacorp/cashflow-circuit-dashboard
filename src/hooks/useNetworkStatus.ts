
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);
  const [offlineTimestamp, setOfflineTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        // Calculate how long the user was offline
        if (offlineTimestamp) {
          const duration = Math.round((Date.now() - offlineTimestamp) / 1000);
          setOfflineDuration(duration);
          
          // Show different messages based on offline duration
          if (duration < 60) {
            toast.success(`You are back online. Your data will sync now.`);
          } else if (duration < 3600) {
            toast.success(`You are back online after ${Math.round(duration/60)} minutes. Your data will sync now.`);
          } else {
            toast.success(`You are back online after ${Math.round(duration/3600)} hours. Your data will sync now.`);
          }
        } else {
          toast.success('You are back online. Your data will sync now.');
        }
        
        setWasOffline(false);
        setOfflineTimestamp(null);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setOfflineTimestamp(Date.now());
      toast.warning('You are offline. Your changes will be saved locally and synced when you reconnect.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we're recovering from a refresh while offline
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      setOfflineTimestamp(Date.now());
      // No toast here to avoid duplicate messages on load
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, offlineTimestamp]);

  return isOnline;
}
