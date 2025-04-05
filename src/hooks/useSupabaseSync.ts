
import { useState, useEffect } from 'react';
import { useTransactions } from '@/context/transaction';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TransactionType, EmotionalState } from '@/context/transaction/types';

type SupabaseCount = {
  count: number;
}

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { state, importData, replaceAllData } = useTransactions();
  const { user, profile } = useAuth();

  // Function to backup data to Supabase
  const backupToSupabase = async () => {
    if (!user) {
      toast.error('You must be logged in to backup data');
      return false;
    }

    setIsSyncing(true);
    try {
      // Delete existing data for this user to prevent duplicates
      await supabase.from('transactions').delete().eq('user_email', user.email);
      await supabase.from('categories').delete().eq('user_email', user.email);
      
      // Insert transactions
      if (state.transactions.length > 0) {
        const transactionRows = state.transactions.map(transaction => ({
          user_email: user.email,
          transaction_id: transaction.id,
          type: transaction.type,
          category_id: transaction.categoryId,
          amount: transaction.amount,
          description: transaction.description || '',
          date: transaction.date,
          emotional_state: transaction.emotionalState || 'neutral'
        }));
        
        // Use any to bypass type checking for now since we know these tables exist
        const { error: transactionsError } = await (supabase.from('transactions') as any).insert(transactionRows);
        if (transactionsError) throw transactionsError;
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
        
        // Use any to bypass type checking for now since we know these tables exist
        const { error: categoriesError } = await (supabase.from('categories') as any).insert(categoryRows);
        if (categoriesError) throw categoriesError;
      }
      
      // Update profile with last backup date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      const now = new Date();
      setLastSyncDate(now);
      
      toast.success('Data backed up successfully');
      return true;
    } catch (error: any) {
      console.error('Backup error:', error);
      toast.error('Failed to backup data', {
        description: error.message
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to restore data from Supabase
  const restoreFromSupabase = async () => {
    if (!user) {
      toast.error('You must be logged in to restore data');
      return false;
    }

    setIsSyncing(true);
    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await (supabase
        .from('transactions') as any)
        .select('*')
        .eq('user_email', user.email);
      
      if (transactionsError) throw transactionsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await (supabase
        .from('categories') as any)
        .select('*')
        .eq('user_email', user.email);
      
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
      
      toast.success('Data restored successfully');
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error('Failed to restore data', {
        description: error.message
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync data when a user logs in
  useEffect(() => {
    if (user && profile) {
      const syncData = async () => {
        // Check if we have local data
        const hasLocalData = state.transactions.length > 0 || state.categories.length > 0;
        
        // Check if we have remote data
        const { data: remoteTrans, error } = await (supabase
          .from('transactions') as any)
          .select('count', { count: 'exact', head: true })
          .eq('user_email', user.email);
        
        const remoteCount = remoteTrans?.count ?? 0;
        
        // If we have remote data but no local data, restore from remote
        if (remoteCount > 0 && !hasLocalData) {
          restoreFromSupabase();
        } 
        // If we have local data but no remote data, backup to remote
        else if (hasLocalData && remoteCount === 0) {
          backupToSupabase();
        }
        // If we have both, check which is newer
        else if (hasLocalData && remoteCount > 0) {
          if (profile.backup_last_date) {
            const backupDate = new Date(profile.backup_last_date);
            const localStorageDate = localStorage.getItem('lastTransactionUpdate');
            
            if (localStorageDate) {
              const localDate = new Date(localStorageDate);
              if (localDate > backupDate) {
                await backupToSupabase();
              } else {
                await restoreFromSupabase();
              }
            } else {
              // If no local timestamp, use remote data
              await restoreFromSupabase();
            }
          } else {
            // No backup date, assume local is newer
            await backupToSupabase();
          }
        }
      };
      
      syncData().catch(console.error);
    }
  }, [user, profile]);

  // Auto-backup when data changes
  useEffect(() => {
    if (user) {
      const debounceTimeout = setTimeout(() => {
        backupToSupabase().catch(console.error);
        localStorage.setItem('lastTransactionUpdate', new Date().toISOString());
      }, 5000); // Debounce to avoid too many requests
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [state.transactions, state.categories, user]);

  return {
    isSyncing,
    lastSyncDate,
    backupToSupabase,
    restoreFromSupabase
  };
}
