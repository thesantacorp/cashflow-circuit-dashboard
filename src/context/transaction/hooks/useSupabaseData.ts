
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Helper function to get data from localStorage with enhanced error handling
  const getDataFromLocalStorage = (): TransactionState | null => {
    try {
      const savedState = localStorage.getItem("transactionState");
      if (!savedState) {
        console.log("No transactionState found in localStorage");
        return null;
      }
      
      const parsedState = JSON.parse(savedState);
      console.log("Found data in localStorage:", parsedState);
      
      // Validate state structure
      if (!Array.isArray(parsedState.transactions)) {
        console.error("Invalid transactions array in localStorage");
        return null;
      }
      
      if (!Array.isArray(parsedState.categories)) {
        console.error("Invalid categories array in localStorage");
        return null;
      }
      
      // Add additional validation to avoid crashes
      const validTransactions = parsedState.transactions.filter(t => 
        t && typeof t === 'object' && t.id && 
        typeof t.amount === 'number' && !isNaN(t.amount) &&
        typeof t.type === 'string' && 
        (t.type === 'expense' || t.type === 'income')
      );
      
      if (validTransactions.length !== parsedState.transactions.length) {
        console.warn(`Filtered out ${parsedState.transactions.length - validTransactions.length} invalid transactions`);
        parsedState.transactions = validTransactions;
      }
      
      console.log(`Loaded ${parsedState.transactions.length} transactions and ${parsedState.categories.length} categories from localStorage`);
      return parsedState;
    } catch (error) {
      console.error("Failed to parse localStorage data:", error);
      return null;
    }
  };

  const loadInitialData = useCallback(async (): Promise<TransactionState | null> => {
    if (!user) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    console.log("Attempting to load data for user:", user.email);
    
    try {
      // First priority: check localStorage
      const localData = getDataFromLocalStorage();
      
      // Second priority: try loading from Supabase
      let cloudTransactions = [];
      let cloudCategories = [];
      
      try {
        const { transactions, error: transactionsError } = await fetchTransactions(user.email);
        
        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
        } else {
          cloudTransactions = transactions;
          console.log(`Loaded ${cloudTransactions.length} transactions from cloud`);
        }
        
        const { categories, error: categoriesError } = await fetchCategories(user.email);
        
        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        } else {
          cloudCategories = categories;
          console.log(`Loaded ${cloudCategories.length} categories from cloud`);
        }
      } catch (cloudError) {
        console.error("Cloud data fetch failed completely:", cloudError);
        // Continue with local data if available
      }
      
      // Decision logic: which data source to use
      let finalTransactions = cloudTransactions;
      let finalCategories = cloudCategories.length > 0 ? cloudCategories : allDefaultCategories;
      
      // If we have local data with transactions, prioritize it
      if (localData && localData.transactions.length > 0) {
        // If local has more transactions than cloud, use local
        if (localData.transactions.length > cloudTransactions.length) {
          console.log(`Using local data with ${localData.transactions.length} transactions instead of cloud data with ${cloudTransactions.length} transactions`);
          finalTransactions = localData.transactions;
          
          // If local has categories, use those too
          if (localData.categories && localData.categories.length > 0) {
            finalCategories = localData.categories;
          }
        } 
        // If cloud has equal or more, but we're not sure if it's up to date, merge them
        else if (cloudTransactions.length > 0) {
          console.log(`Merging local (${localData.transactions.length}) and cloud (${cloudTransactions.length}) transactions`);
          // Create a combined array with both sources
          const mergedTransactions = [...cloudTransactions];
          
          // Add any local transactions not in the cloud data (based on ID)
          localData.transactions.forEach(localTx => {
            if (!mergedTransactions.some(cloudTx => cloudTx.id === localTx.id)) {
              mergedTransactions.push(localTx);
            }
          });
          
          finalTransactions = mergedTransactions;
          console.log(`After merging, we have ${finalTransactions.length} transactions`);
        }
      } else if (cloudTransactions.length === 0 && (localData === null || localData.transactions.length === 0)) {
        console.log("No transactions found in cloud or local storage");
        // No transactions anywhere - use empty array
        finalTransactions = [];
      }
      
      const newState: TransactionState = {
        transactions: finalTransactions,
        categories: finalCategories,
        nextTransactionId: 1,
        nextCategoryId: 100
      };
      
      setLastSyncTime(new Date());
      setRestorationAttempted(true);
      setIsLoading(false);
      
      return newState;
    } catch (error) {
      console.error("Error loading data:", error);
      
      // Ultimate fallback: Try to load from localStorage if everything else failed
      const localData = getDataFromLocalStorage();
      if (localData) {
        console.log("Using localStorage data as fallback after error");
        setRestorationAttempted(true);
        setIsLoading(false);
        return localData;
      }
      
      setIsLoading(false);
      return null;
    }
  }, [user]);

  const refreshData = useCallback(async (currentState: TransactionState, silent = true): Promise<TransactionState | null> => {
    if (!user || !navigator.onLine) {
      return null;
    }

    try {
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        console.error("Error refreshing transactions:", transactionsError);
        throw transactionsError;
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        console.error("Error refreshing categories:", categoriesError);
        throw categoriesError;
      }
      
      // Always prioritize local state if it has more transactions
      if (currentState.transactions.length > transactions.length) {
        console.log(`Using current state with ${currentState.transactions.length} transactions instead of cloud data with ${transactions.length} transactions`);
        
        // Instead of discarding cloud data, merge it
        const mergedTransactions = [...currentState.transactions];
        
        // Add any cloud transactions not in the current state (based on ID)
        transactions.forEach(cloudTx => {
          if (!mergedTransactions.some(localTx => localTx.id === cloudTx.id)) {
            mergedTransactions.push(cloudTx);
          }
        });
        
        const mergedState = {
          ...currentState,
          transactions: mergedTransactions,
          categories: currentState.categories.length > categories.length ? currentState.categories : categories
        };
        
        console.log(`After merging, state has ${mergedState.transactions.length} transactions`);
        setLastSyncTime(new Date());
        return mergedState;
      }
      
      const finalCategories = categories.length > 0 ? categories : 
          (currentState.categories.length > 0 ? currentState.categories : allDefaultCategories);
      
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
