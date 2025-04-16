
import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/context/transaction';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/utils/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Maximum number of retries for Supabase operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Key for tracking if this is the first login on this device
const FIRST_LOGIN_KEY = 'is_first_login_on_device';
// Key for tracking notification status
const NOTIFIED_THIS_SESSION_KEY = 'notified_this_session';
// Key for tracking last sync attempt
const LAST_SYNC_ATTEMPT_KEY = 'last_sync_attempt';

/**
 * Utility function to wait for a specified delay
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hook for handling Supabase data synchronization
 */
export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { 
    state, 
    importData, 
    replaceAllData, 
    refreshData, 
    syncToSupabase: contextSyncToSupabase 
  } = useTransactions();
  const { user, profile } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    return localStorage.getItem(FIRST_LOGIN_KEY) === 'true';
  });
  const location = useLocation();
  
  // Track if we've already notified the user this session
  const [hasNotifiedThisSession, setHasNotifiedThisSession] = useState<boolean>(() => {
    return sessionStorage.getItem(NOTIFIED_THIS_SESSION_KEY) === 'true';
  });

  // Set notification session status
  useEffect(() => {
    if (hasNotifiedThisSession) {
      sessionStorage.setItem(NOTIFIED_THIS_SESSION_KEY, 'true');
    }
  }, [hasNotifiedThisSession]);

  // Track if this is the first login on this device
  useEffect(() => {
    if (user && !localStorage.getItem(FIRST_LOGIN_KEY)) {
      localStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setIsFirstLogin(true);
    }
  }, [user]);

  // Enable real-time functionality for the tables
  useEffect(() => {
    if (user) {
      const enableRealtime = async () => {
        try {
          // Check if realtime is already enabled by trying to subscribe to a test channel
          const testChannel = supabase.channel('test-realtime');
          await testChannel.subscribe();
          supabase.removeChannel(testChannel);
          console.log('Realtime is working');
        } catch (error) {
          console.error('Error testing realtime subscription:', error);
        }
      };
      
      enableRealtime();
    }
  }, [user]);

  /**
   * Execute a Supabase operation with retry logic
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        return await operation();
      } catch (error: any) {
        retries++;
        console.error(`${operationName} attempt ${retries} failed:`, error);
        
        if (retries >= MAX_RETRIES) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        await wait(RETRY_DELAY * Math.pow(2, retries - 1));
      }
    }
    
    throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts`);
  }, []);

  // Function to get the best available Supabase client
  const getBestClient = useCallback(async () => {
    // First try the integrated client
    try {
      const { data, error } = await supabase.from('user_uuids').select('count', { count: 'exact', head: true }).limit(1);
      if (!error) {
        console.log('Using integrated Supabase client');
        return supabase;
      }
    } catch (err) {
      console.log('Integrated client failed, falling back to custom client');
    }
    
    // If that fails, try the custom client
    const customClient = getSupabaseClient();
    if (!customClient) {
      throw new Error('Failed to initialize Supabase client');
    }
    console.log('Using custom Supabase client');
    return customClient;
  }, []);

  // Function to sync data to Supabase (formerly backup)
  const syncToSupabase = useCallback(async () => {
    if (!user) {
      if (location.pathname === '/profile') {
        toast.error("You must be logged in to sync data");
      }
      return false;
    }

    // Save the sync attempt time
    localStorage.setItem(LAST_SYNC_ATTEMPT_KEY, new Date().toISOString());
    
    setIsSyncing(true);
    
    try {
      // Use the context's syncToSupabase function which is optimized for direct sync
      const success = await contextSyncToSupabase();
      
      if (success) {
        const now = new Date();
        setLastSyncDate(now);
        localStorage.setItem('lastTransactionUpdate', now.toISOString());
        
        // Only show success toast on profile page
        if (location.pathname === '/profile') {
          toast.success("Data synced successfully to cloud");
        }
        return true;
      } else {
        // Only show error toast on profile page
        if (location.pathname === '/profile') {
          toast.error("Failed to sync data to cloud");
        }
        return false;
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      // Only show error toast on profile page
      if (location.pathname === '/profile') {
        toast.error(error.message || 'Network error occurred');
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, contextSyncToSupabase, location.pathname]);

  // Function to restore data from Supabase
  const restoreFromSupabase = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to restore data");
      return false;
    }

    // Confirm overwriting of local data
    if (!window.confirm('This will replace your current data with data from the cloud. Are you sure you want to continue?')) {
      return false;
    }

    setIsSyncing(true);
    
    try {
      // Get the best available client
      const client = await getBestClient();
      
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await executeWithRetry(async () => {
        return await (client.from('transactions') as any)
          .select('*')
          .eq('user_email', user.email);
      }, 'Fetch transactions');
      
      if (transactionsError) throw transactionsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await executeWithRetry(async () => {
        return await (client.from('categories') as any)
          .select('*')
          .eq('user_email', user.email);
      }, 'Fetch categories');
      
      if (categoriesError) throw categoriesError;
      
      // Transform data to match application state format
      const transformedData = {
        transactions: transactionsData.map((t: any) => ({
          id: t.transaction_id,
          type: t.type,
          categoryId: t.category_id,
          amount: t.amount,
          description: t.description,
          date: t.date,
          emotionalState: t.emotional_state
        })),
        categories: categoriesData.map((c: any) => ({
          id: c.category_id,
          name: c.name,
          type: c.type,
          color: c.color
        }))
      };
      
      // Replace all data in the app
      replaceAllData(transformedData);
      
      const now = new Date();
      setLastSyncDate(now);
      localStorage.setItem('lastTransactionUpdate', now.toISOString());
      
      // Only show success toast on profile page
      if (location.pathname === '/profile') {
        toast.success("Data restored successfully from cloud");
      }
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      // Only show error toast on profile page
      if (location.pathname === '/profile') {
        toast.error(error.message || 'Network error occurred');
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, executeWithRetry, replaceAllData, getBestClient, location.pathname]);

  // Auto-sync data on component mount or when data changes significantly
  useEffect(() => {
    if (!user || !navigator.onLine) return;
    
    // Only run this if we haven't synced recently (within last 30 seconds)
    const lastSyncAttempt = localStorage.getItem(LAST_SYNC_ATTEMPT_KEY);
    if (lastSyncAttempt) {
      const lastAttemptTime = new Date(lastSyncAttempt).getTime();
      const now = new Date().getTime();
      const timeSinceLastSync = now - lastAttemptTime;
      
      // If less than 30 seconds have passed since last sync attempt, skip
      if (timeSinceLastSync < 30000) {
        console.log('Skipping auto-sync, last attempt was less than 30 seconds ago');
        return;
      }
    }
    
    // Check if we have a significant number of transactions that might need syncing
    if (state.transactions.length > 0) {
      console.log('Auto-syncing data to Supabase');
      syncToSupabase().catch(err => {
        console.error('Auto-sync error:', err);
      });
    }
  }, [user, state.transactions.length, syncToSupabase]);

  // Auto-sync data when a user logs in - but with prevention for first login
  useEffect(() => {
    if (user && profile) {
      // Check if this is the first login on this device
      const isFirstLoginOnDevice = localStorage.getItem(FIRST_LOGIN_KEY) === 'true';
      
      // If this is the first login, don't auto-sync to prevent data loss
      if (isFirstLoginOnDevice) {
        console.log('First login detected. Auto-sync disabled to prevent data loss.');
        
        // Only show the welcome back message on the profile page
        if (location.pathname === '/profile') {
          toast.info("Welcome back! Existing user just signing in on a new device? Restore data first!");
        }
        return;
      }
      
      const syncData = async () => {
        try {
          // Get the best available client
          const client = await getBestClient();
          
          // Check if we have local data
          const hasLocalData = state.transactions.length > 0 || state.categories.length > 0;
          
          // Check if we have remote data
          let remoteCount = 0;
          try {
            const { data } = await client
              .from('transactions')
              .select('count', { count: 'exact', head: true })
              .eq('user_email', user.email);
            
            // Handle correctly when data is an array or an object with count property
            if (data) {
              if (Array.isArray(data) && data[0]?.count) {
                remoteCount = data[0].count;
              } else if (typeof data === 'object' && (data as any).count !== undefined) {
                remoteCount = (data as any).count;
              }
            }
          } catch (error) {
            console.error('Error checking remote data count:', error);
          }
          
          // Decision logic for syncing data
          if (remoteCount > 0 && !hasLocalData) {
            // If remote data exists but no local data, restore from remote
            await restoreFromSupabase();
          } else if (hasLocalData && remoteCount === 0) {
            // If local data exists but no remote data, backup to remote
            await syncToSupabase();
          } else if (hasLocalData && remoteCount > 0) {
            // If both exist, check which is newer
            if (profile.backup_last_date) {
              const backupDate = new Date(profile.backup_last_date);
              const localStorageDate = localStorage.getItem('lastTransactionUpdate');
              
              if (localStorageDate) {
                const localDate = new Date(localStorageDate);
                if (localDate > backupDate) {
                  // Local is newer
                  await syncToSupabase();
                } else {
                  // Remote is newer
                  await refreshData(true);
                }
              } else {
                // No local timestamp, use remote data
                await refreshData(true);
              }
            } else {
              // No backup date in profile, assume local is newer
              await syncToSupabase();
            }
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      };
      
      syncData().catch(console.error);
    }
  }, [user, profile, state.transactions.length, state.categories.length, syncToSupabase, restoreFromSupabase, getBestClient, location.pathname, refreshData]);

  // Clear first login flag on manual restore
  const handleManualRestore = async () => {
    const success = await restoreFromSupabase();
    if (success) {
      // After successful manual restore, this is no longer considered first login
      localStorage.setItem(FIRST_LOGIN_KEY, 'false');
      setIsFirstLogin(false);
    }
    return success;
  };

  // Update UI with latest sync time
  useEffect(() => {
    if (user && profile && profile.backup_last_date) {
      setLastSyncDate(new Date(profile.backup_last_date));
    }
  }, [user, profile]);

  return {
    isSyncing,
    lastSyncDate,
    backupToSupabase: syncToSupabase, // Keep for backward compatibility
    syncToSupabase,                   // New, clearer naming
    restoreFromSupabase: handleManualRestore,
    isFirstLogin,
    hasNotifiedThisSession,
    setHasNotifiedThisSession
  };
}
