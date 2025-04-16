
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

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  const loadInitialData = useCallback(async (): Promise<TransactionState | null> => {
    if (!user) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    console.log("Attempting to load data for user:", user.email);
    
    try {
      // First attempt - try loading from Supabase
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        // Don't show toast here, just log the error
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        // Don't show toast here, just log the error
      }

      // Fallback to localStorage if needed
      const localData = getDataFromLocalStorage();
      
      // Use either remote data or local data (whichever has more transactions)
      let finalTransactions = transactions;
      let finalCategories = categories.length > 0 ? categories : allDefaultCategories;
      
      // If we have local data with more transactions than what we loaded from cloud, use that
      if (localData && localData.transactions.length > transactions.length) {
        console.log(`Using local data with ${localData.transactions.length} transactions instead of remote data with ${transactions.length} transactions`);
        finalTransactions = localData.transactions;
        
        // If local categories exist and have more items, use those
        if (localData.categories && localData.categories.length > 0) {
          finalCategories = localData.categories;
        }
      }
      
      const newState: TransactionState = {
        transactions: finalTransactions,
        categories: finalCategories,
        nextTransactionId: 1,
        nextCategoryId: 100
      };
      
      setLastSyncTime(new Date());
      setRestorationAttempted(true);
      
      return newState;
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      
      // Final fallback: Try to load from localStorage if Supabase fails completely
      const localData = getDataFromLocalStorage();
      if (localData) {
        console.log("Using localStorage data as fallback");
        setRestorationAttempted(true);
        return localData;
      }
      
      // Only show error toast if both remote and local recovery failed
      toast.error("Failed to load data from cloud or local storage");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Helper function to get data from localStorage
  const getDataFromLocalStorage = (): TransactionState | null => {
    try {
      const savedState = localStorage.getItem("transactionState");
      if (!savedState) return null;
      
      const parsedState = JSON.parse(savedState);
      console.log("Found data in localStorage:", parsedState);
      
      if (!Array.isArray(parsedState.transactions) || !Array.isArray(parsedState.categories)) {
        console.error("Invalid data structure in localStorage");
        return null;
      }
      
      console.log(`Loaded ${parsedState.transactions.length} transactions and ${parsedState.categories.length} categories from localStorage`);
      return parsedState;
    } catch (error) {
      console.error("Failed to parse localStorage data:", error);
      return null;
    }
  };

  const refreshData = useCallback(async (currentState: TransactionState, silent = true): Promise<TransactionState | null> => {
    if (!user || !navigator.onLine) {
      return null;
    }

    try {
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        if (!silent) {
          toast.error("Failed to load transactions from cloud");
        }
        throw transactionsError;
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        if (!silent) {
          toast.error("Failed to load categories from cloud");
        }
        throw categoriesError;
      }
      
      // Use local state if it has more transactions (data restoration)
      if (currentState.transactions.length > transactions.length && !restorationAttempted) {
        console.log(`Using current state with ${currentState.transactions.length} transactions instead of remote data with ${transactions.length} transactions`);
        setRestorationAttempted(true);
        return currentState;
      }
      
      const finalCategories = categories.length > 0 ? categories : allDefaultCategories;
      
      const newState: TransactionState = {
        transactions,
        categories: finalCategories,
        nextTransactionId: currentState.nextTransactionId,
        nextCategoryId: currentState.nextCategoryId
      };
      
      setLastSyncTime(new Date());
      
      return newState;
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
      // Only show error toasts if not in silent mode
      if (!silent) {
        toast.error('Failed to refresh data from cloud');
      }
      return null;
    }
  }, [user, restorationAttempted]);

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
