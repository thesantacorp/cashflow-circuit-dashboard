
import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/context/transaction';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/utils/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

// Maximum number of retries for Supabase operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Key for tracking if this is the first login on this device
const FIRST_LOGIN_KEY = 'is_first_login_on_device';

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
  const { state, importData, replaceAllData } = useTransactions();
  const { user, profile } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    return localStorage.getItem(FIRST_LOGIN_KEY) === 'true';
  });
  const location = useLocation();

  // Track if this is the first login on this device
  useEffect(() => {
    if (user && !localStorage.getItem(FIRST_LOGIN_KEY)) {
      localStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setIsFirstLogin(true);
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
        toast({
          title: "Error",
          description: "You must be logged in to sync data",
          variant: "destructive"
        });
      }
      return false;
    }

    setIsSyncing(true);
    
    try {
      // Get the best available client
      const client = await getBestClient();
      
      // Check connection to Supabase before proceeding
      await executeWithRetry(async () => {
        const { data, error } = await client.from('user_uuids').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        return data;
      }, 'Connection check');
      
      // Delete existing data for this user to prevent duplicates
      await executeWithRetry(async () => {
        const { error } = await (client.from('transactions') as any).delete().eq('user_email', user.email);
        if (error) throw error;
        return true;
      }, 'Delete existing transactions');
      
      await executeWithRetry(async () => {
        const { error } = await (client.from('categories') as any).delete().eq('user_email', user.email);
        if (error) throw error;
        return true;
      }, 'Delete existing categories');
      
      // Insert transactions in batches
      if (state.transactions.length > 0) {
        const batchSize = 50; // Process transactions in smaller batches
        const batches = Math.ceil(state.transactions.length / batchSize);
        
        for (let i = 0; i < batches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, state.transactions.length);
          const batch = state.transactions.slice(start, end);
          
          const transactionRows = batch.map(transaction => ({
            user_email: user.email,
            transaction_id: transaction.id,
            type: transaction.type,
            category_id: transaction.categoryId,
            amount: transaction.amount,
            description: transaction.description || '',
            date: transaction.date,
            emotional_state: transaction.emotionalState || 'neutral'
          }));
          
          await executeWithRetry(async () => {
            const { error } = await (client.from('transactions') as any).insert(transactionRows);
            if (error) throw error;
            return true;
          }, `Insert transactions batch ${i + 1}/${batches}`);
        }
      }
      
      // Insert categories
      if (state.categories.length > 0) {
        const categoryRows = state.categories.map(category => ({
          user_email: user.email,
          category_id: category.id,
          name: category.name,
          type: category.type,
          color: category.color
        }));
        
        await executeWithRetry(async () => {
          const { error } = await (client.from('categories') as any).insert(categoryRows);
          if (error) throw error;
          return true;
        }, 'Insert categories');
      }
      
      // Update profile with last backup date
      if (user.id) {
        await executeWithRetry(async () => {
          const { error } = await client
            .from('profiles')
            .update({ 
              backup_last_date: new Date().toISOString()
            })
            .eq('id', user.id);
          if (error) throw error;
          return true;
        }, 'Update profile backup date');
      }
      
      const now = new Date();
      setLastSyncDate(now);
      localStorage.setItem('lastTransactionUpdate', now.toISOString());
      
      // Only show success toast on profile page
      if (location.pathname === '/profile') {
        toast({
          title: "Success",
          description: "Data synced successfully to cloud",
        });
      }
      return true;
    } catch (error: any) {
      console.error('Sync error:', error);
      // Only show error toast on profile page
      if (location.pathname === '/profile') {
        toast({
          title: "Error",
          description: error.message || 'Network error occurred',
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, state.transactions, state.categories, executeWithRetry, getBestClient, location.pathname]);

  // Function to restore data from Supabase
  const restoreFromSupabase = useCallback(async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to restore data",
        variant: "destructive"
      });
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
        toast({
          title: "Success",
          description: "Data restored successfully from cloud",
        });
      }
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      // Only show error toast on profile page
      if (location.pathname === '/profile') {
        toast({
          title: "Error",
          description: error.message || 'Network error occurred',
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, executeWithRetry, replaceAllData, getBestClient, location.pathname]);

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
          toast({
            title: "Welcome back",
            description: "Existing user just signing in on a new device? Restore data first!",
            duration: 7000,
          });
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
                  await restoreFromSupabase();
                }
              } else {
                // No local timestamp, use remote data
                await restoreFromSupabase();
              }
            } else {
              // No backup date in profile, assume local is newer
              await syncToSupabase();
            }
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
          toast({
            title: "Error",
            description: "We encountered an issue syncing your data. You can try again manually.",
            variant: "destructive",
          });
        }
      };
      
      syncData().catch(console.error);
    }
  }, [user, profile, state.transactions.length, state.categories.length, syncToSupabase, restoreFromSupabase, getBestClient, location.pathname]);

  // Make sync instant for any data changes
  useEffect(() => {
    if (user && !isFirstLogin && (state.transactions.length > 0 || state.categories.length > 0)) {
      // Immediate sync without debounce for real-time updates across devices
      syncToSupabase().catch(error => console.error('Instant sync error:', error));
      
      localStorage.setItem('lastTransactionUpdate', new Date().toISOString());
    }
  }, [state.transactions, state.categories, user, syncToSupabase, isFirstLogin]);

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

  return {
    isSyncing,
    lastSyncDate,
    backupToSupabase: syncToSupabase, // Keep for backward compatibility
    syncToSupabase,                   // New, clearer naming
    restoreFromSupabase: handleManualRestore,
    isFirstLogin
  };
}
