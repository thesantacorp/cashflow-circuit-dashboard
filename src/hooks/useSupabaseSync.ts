import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/context/transaction';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/utils/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { state, replaceAllData } = useTransactions();
  const { user, profile } = useAuth();

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
      toast('You must be logged in to sync data');
      return false;
    }

    if (state.transactions.length === 0 && state.categories.length === 0) {
      console.log('[useSupabaseSync] Local data is empty — skipping manual sync');
      return false;
    }

    console.log('[useSupabaseSync] Starting smart merge sync to Supabase');
    setIsSyncing(true);
    
    try {
      const client = await getBestClient();
      
      await executeWithRetry(async () => {
        const { data, error } = await client.from('user_uuids').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        return data;
      }, 'Connection check');

      const { data: existingTransactions } = await (client.from('transactions') as any)
        .select('transaction_id')
        .eq('user_email', user.email);
      
      const existingTxIds = new Set((existingTransactions || []).map((t: any) => t.transaction_id));
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
      
      console.log(`[useSupabaseSync] Smart merge completed — added ${newTransactions.length} transactions, ${newCategories.length} categories`);
      toast(`Sync complete: ${newTransactions.length} new transactions merged to cloud`);
      
      return true;
    } catch (error: any) {
      console.error('Sync error:', error);
      toast('Failed to sync data. Please try again.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, state.transactions, state.categories, executeWithRetry, getBestClient]);

  const restoreFromSupabase = useCallback(async () => {
    if (!user) {
      toast('You must be logged in to restore data');
      return false;
    }

    if (!window.confirm('This will replace your current data with data from the cloud. Are you sure you want to continue?')) {
      return false;
    }

    console.log('[useSupabaseSync] Starting data restore from Supabase - Cloud data will overwrite local data');
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
      
      console.log('[useSupabaseSync] Restore completed successfully - Cloud data has replaced local data');
      toast('Data restored successfully from the cloud');
      
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      toast('Failed to restore data. Please try again.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, executeWithRetry, replaceAllData, getBestClient]);

  useEffect(() => {
    if (user && profile?.backup_last_date) {
      setLastSyncDate(new Date(profile.backup_last_date));
      return;
    }

    if (!user) {
      setLastSyncDate(null);
    }
  }, [user, profile]);

  return {
    isSyncing,
    lastSyncDate,
    backupToSupabase: syncToSupabase,
    syncToSupabase,
    restoreFromSupabase,
    isFirstLogin: false
  };
}
