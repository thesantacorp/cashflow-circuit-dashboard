
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchTransactions, 
  fetchCategories
} from '@/utils/supabase/tableManagement';
import { TransactionState } from '../types';
import { allDefaultCategories } from '../defaultCategories';

/**
 * Hook to handle data operations with Supabase
 */
export const useSupabaseData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  /**
   * Load initial data from Supabase
   */
  const loadInitialData = useCallback(async (): Promise<TransactionState | null> => {
    if (!user) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        toast.error("Failed to load transactions from cloud");
        setIsLoading(false);
        return null;
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        toast.error("Failed to load categories from cloud");
        setIsLoading(false);
        return null;
      }

      const finalCategories = categories.length > 0 ? categories : allDefaultCategories;
      
      const newState: TransactionState = {
        transactions,
        categories: finalCategories,
        nextTransactionId: 1,
        nextCategoryId: 100
      };
      
      setLastSyncTime(new Date());
      toast.success("Data loaded from cloud");
      return newState;
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      toast.error("Failed to load data from cloud");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Refresh data from Supabase
   * @param silent If true, don't show success toast notifications
   */
  const refreshData = useCallback(async (currentState: TransactionState, silent = false): Promise<TransactionState | null> => {
    if (!user || !navigator.onLine) {
      return null;
    }

    try {
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        throw transactionsError;
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        throw categoriesError;
      }
      
      const finalCategories = categories.length > 0 ? categories : allDefaultCategories;
      
      const newState: TransactionState = {
        transactions,
        categories: finalCategories,
        nextTransactionId: currentState.nextTransactionId,
        nextCategoryId: currentState.nextCategoryId
      };
      
      setLastSyncTime(new Date());
      
      // Only show toast notification if not silent
      if (!silent) {
        toast.success("Data refreshed from cloud");
      }
      
      return newState;
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
      // Always show error toasts, even in silent mode
      toast.error('Failed to refresh data from cloud');
      return null;
    }
  }, [user]);

  /**
   * Set up real-time subscription to Supabase
   */
  const setupRealtimeSubscription = useCallback((callback: () => void) => {
    if (!user) return null;

    const channel = supabase
      .channel('transaction-updates')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'transactions',
        filter: `user_email=eq.${user.email}`
      }, (payload) => {
        console.log('Database change received:', payload);
        callback();
      })
      .subscribe();

    return channel;
  }, [user]);

  return {
    isLoading,
    lastSyncTime,
    loadInitialData,
    refreshData,
    setupRealtimeSubscription,
    setLastSyncTime
  };
};
