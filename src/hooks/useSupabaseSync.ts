import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/context/transaction';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/utils/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const FIRST_LOGIN_KEY = 'is_first_login_on_device';
const DISABLE_AUTO_SYNC_KEY = 'disable_auto_sync';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { state, importData, replaceAllData, refreshData } = useTransactions();
  const { user, profile } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    return localStorage.getItem(FIRST_LOGIN_KEY) === 'true';
  });
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user && !localStorage.getItem(FIRST_LOGIN_KEY)) {
      localStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setIsFirstLogin(true);
      localStorage.setItem(DISABLE_AUTO_SYNC_KEY, 'true');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const enableRealtime = async () => {
        try {
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
        
        await wait(RETRY_DELAY * Math.pow(2, retries - 1));
      }
    }
    
    throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts`);
  }, []);

  const getBestClient = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('user_uuids').select('count', { count: 'exact', head: true }).limit(1);
      if (!error) {
        console.log('Using integrated Supabase client');
        return supabase;
      }
    } catch (err) {
      console.log('Integrated client failed, falling back to custom client');
    }
    
    const customClient = getSupabaseClient();
    if (!customClient) {
      throw new Error('Failed to initialize Supabase client');
    }
    console.log('Using custom Supabase client');
    return customClient;
  }, []);

  const syncToSupabase = useCallback(async () => {
    if (!user) {
      if (location.pathname === '/profile') {
        toast("You must be logged in to sync data");
      }
      return false;
    }

    // SAFETY: Never overwrite cloud data with empty local data
    if (state.transactions.length === 0 && state.categories.length === 0) {
      console.log("[useSupabaseSync] Local data is empty — skipping sync to prevent overwriting cloud data");
      toast("No local data to sync. Use 'Restore from Cloud' to get your data back.");
      return false;
    }

    console.log("[useSupabaseSync] Starting smart merge sync to Supabase");
    setIsSyncing(true);
    
    try {
      const client = await getBestClient();
      
      await executeWithRetry(async () => {
        const { data, error } = await client.from('user_uuids').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        return data;
      }, 'Connection check');

      // Fetch existing cloud data
      const { data: existingTransactions } = await (client.from('transactions') as any)
        .select('transaction_id')
        .eq('user_email', user.email);
      
      const existingTxIds = new Set((existingTransactions || []).map((t: any) => t.transaction_id));

      // Only insert transactions that don't already exist in the cloud
      const newTransactions = state.transactions.filter(t => !existingTxIds.has(t.id));
      
      if (newTransactions.length > 0) {
        const batchSize = 50;
        const batches = Math.ceil(newTransactions.length / batchSize);
        
        for (let i = 0; i < batches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, newTransactions.length);
          const batch = newTransactions.slice(start, end);
          
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

      // Merge categories — only insert new ones
      const { data: existingCategories } = await (client.from('categories') as any)
        .select('category_id')
        .eq('user_email', user.email);

      const existingCatIds = new Set((existingCategories || []).map((c: any) => c.category_id));
      const newCategories = state.categories.filter(c => !existingCatIds.has(c.id));

      if (newCategories.length > 0) {
        const categoryRows = newCategories.map(category => ({
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
      
      localStorage.removeItem(DISABLE_AUTO_SYNC_KEY);
      
      console.log(`[useSupabaseSync] Smart merge completed — added ${newTransactions.length} transactions, ${newCategories.length} categories`);
      toast(`Sync complete: ${newTransactions.length} new transactions merged to cloud`);
      
      return true;
    } catch (error: any) {
      console.error('Sync error:', error);
      toast("Failed to sync data. Please try again.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, state.transactions, state.categories, executeWithRetry, getBestClient, location.pathname, isMobile]);

  const restoreFromSupabase = useCallback(async () => {
    if (!user) {
      toast("You must be logged in to restore data");
      return false;
    }

    if (!window.confirm('This will replace your current data with data from the cloud. Are you sure you want to continue?')) {
      return false;
    }

    console.log("[useSupabaseSync] Starting data restore from Supabase - Cloud data will overwrite local data");
    setIsSyncing(true);
    
    try {
      const client = await getBestClient();
      
      const { data: transactionsData, error: transactionsError } = await executeWithRetry(async () => {
        return await (client.from('transactions') as any)
          .select('*')
          .eq('user_email', user.email);
      }, 'Fetch transactions');
      
      if (transactionsError) throw transactionsError;
      
      const { data: categoriesData, error: categoriesError } = await executeWithRetry(async () => {
        return await (client.from('categories') as any)
          .select('*')
          .eq('user_email', user.email);
      }, 'Fetch categories');
      
      if (categoriesError) throw categoriesError;
      
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
      
      replaceAllData(transformedData);
      
      const now = new Date();
      setLastSyncDate(now);
      localStorage.setItem('lastTransactionUpdate', now.toISOString());
      
      localStorage.removeItem(DISABLE_AUTO_SYNC_KEY);
      
      console.log("[useSupabaseSync] Restore completed successfully - Cloud data has replaced local data");
      toast("Data restored successfully from the cloud");
      
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      toast("Failed to restore data. Please try again.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, executeWithRetry, replaceAllData, getBestClient, location.pathname, isMobile]);

  useEffect(() => {
    if (user && profile) {
      const disableAutoSync = localStorage.getItem(DISABLE_AUTO_SYNC_KEY) === 'true';
      
      if (disableAutoSync) {
        console.log('Auto-sync disabled for this device. User must manually sync or restore.');
        return;
      }
      
      const isFirstLoginOnDevice = localStorage.getItem(FIRST_LOGIN_KEY) === 'true';
      
      if (isFirstLoginOnDevice) {
        console.log('First login detected. Auto-sync disabled to prevent data loss.');
        return;
      }
      
      // Simple: always sync local data UP to cloud (additive only, never destructive)
      const syncData = async () => {
        try {
          if (state.transactions.length > 0 || state.categories.length > 0) {
            await syncToSupabase();
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      };
      
      syncData().catch(console.error);
    }
  }, [user, profile, syncToSupabase]);

  const handleManualRestore = async () => {
    const success = await restoreFromSupabase();
    if (success) {
      localStorage.setItem(FIRST_LOGIN_KEY, 'false');
      localStorage.removeItem(DISABLE_AUTO_SYNC_KEY);
      setIsFirstLogin(false);
    }
    return success;
  };

  const handleManualSync = async () => {
    const success = await syncToSupabase();
    if (success) {
      localStorage.removeItem(DISABLE_AUTO_SYNC_KEY);
    }
    return success;
  };

  useEffect(() => {
    if (user && profile && profile.backup_last_date) {
      setLastSyncDate(new Date(profile.backup_last_date));
    }
  }, [user, profile]);

  return {
    isSyncing,
    lastSyncDate,
    backupToSupabase: handleManualSync,
    syncToSupabase: handleManualSync,
    restoreFromSupabase: handleManualRestore,
    isFirstLogin
  };
}
