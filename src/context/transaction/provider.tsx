
import React, { useReducer, useEffect } from "react";
import { TransactionContext } from "./context";
import { supabase } from "@/integrations/supabase/client";
import { TransactionState } from "./types";
import { transactionReducer, initialState } from "./reducer";
import { useTransactionAuth } from "./hooks/useTransactionAuth";
import { useSupabaseData } from "./hooks/useSupabaseData";
import { useTransactionActions } from "./hooks/useTransactionActions";
import { useTransactionUtils } from "./hooks/useTransactionUtils";
import { Transaction, Category } from "@/types";

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  
  // Use our custom hooks
  const { 
    user, 
    isOnline, 
    pendingSyncCount, 
    setPendingSyncCount 
  } = useTransactionAuth();
  
  const {
    isLoading,
    lastSyncTime,
    loadInitialData,
    refreshData: refreshDataFromSupabase,
    setupRealtimeSubscription
  } = useSupabaseData();

  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  } = useTransactionActions(user, isOnline, setPendingSyncCount);

  const {
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    deduplicate
  } = useTransactionUtils(state);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      const loadedData = await loadInitialData();
      if (loadedData) {
        console.log(`Initializing with ${loadedData.transactions.length} transactions and ${loadedData.categories.length} categories`);
        // Always preserve local data if it has more transactions
        if (state.transactions.length > loadedData.transactions.length && state.transactions.length > 0) {
          console.log(`Keeping local state with ${state.transactions.length} transactions instead of loaded data with ${loadedData.transactions.length} transactions`);
          
          // Instead of completely ignoring cloud data, merge it with local data
          const mergedTransactions = [...state.transactions];
          
          // Add any transactions from cloud that aren't in local state
          loadedData.transactions.forEach(cloudTx => {
            if (!mergedTransactions.some(localTx => localTx.id === cloudTx.id)) {
              mergedTransactions.push(cloudTx);
            }
          });
          
          const mergedState = {
            ...state,
            transactions: mergedTransactions,
            categories: state.categories.length >= loadedData.categories.length ? 
              state.categories : loadedData.categories
          };
          
          console.log(`After merging, state now has ${mergedTransactions.length} transactions`);
          dispatch({ type: "SET_STATE", payload: mergedState });
        } else {
          dispatch({ type: "SET_STATE", payload: loadedData });
        }
      }
    };

    initializeData();
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    const handleDataRefresh = () => {
      refreshData(true); // ALWAYS use silent refresh for realtime updates
    };

    const channel = setupRealtimeSubscription(handleDataRefresh);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  // Function to refresh data from Supabase with silent option
  const refreshData = async (silent = true): Promise<boolean> => {
    try {
      const refreshedData = await refreshDataFromSupabase(state, silent);
      if (refreshedData) {
        if (state.transactions.length > 0) {
          // Rather than comparing lengths, always merge cloud and local data
          // This ensures we don't lose transactions that might be in either source
          const mergedTransactions = [...state.transactions];
          
          // Add any transactions from cloud that aren't in local state
          refreshedData.transactions.forEach(cloudTx => {
            if (!mergedTransactions.some(localTx => localTx.id === cloudTx.id)) {
              mergedTransactions.push(cloudTx);
            }
          });
          
          const mergedState = {
            ...state,
            transactions: mergedTransactions,
            categories: state.categories.length > refreshedData.categories.length ? 
              state.categories : refreshedData.categories
          };
          
          console.log(`After merging local (${state.transactions.length}) and cloud (${refreshedData.transactions.length}), state now has ${mergedTransactions.length} transactions`);
          dispatch({ type: "SET_STATE", payload: mergedState });
          return true;
        } else {
          // If we don't have any transactions, update with cloud data
          console.log(`Updating empty state with ${refreshedData.transactions.length} transactions from cloud`);
          dispatch({ type: "SET_STATE", payload: refreshedData });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error in refreshData:", error);
      return false;
    }
  };

  // Replace all data in the state
  const replaceAllData = (data: TransactionState) => {
    console.log(`Replacing all data with ${data.transactions.length} transactions and ${data.categories.length} categories`);
    
    // Ensure we have the latest state before updating
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
    
    // After replacing data, immediately save to localStorage
    try {
      localStorage.setItem("transactionState", JSON.stringify(data));
      localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      console.log("Saved replaced data to localStorage");
      
      // IMPORTANT: After importing or replacing data, always sync to Supabase
      if (user && isOnline) {
        console.log("Auto-syncing imported data to Supabase");
        syncToSupabase().catch(err => {
          console.error("Failed to auto-sync after import:", err);
        });
      }
    } catch (error) {
      console.error("Failed to save to localStorage after replaceAllData:", error);
    }
  };

  // Import partial data into the state
  const importData = (data: Partial<TransactionState>) => {
    const newState = {
      ...state,
      ...data,
      transactions: [...(state.transactions || []), ...(data.transactions || [])]
    };
    console.log(`Importing partial data, resulting in ${newState.transactions.length} transactions and ${newState.categories.length} categories`);
    
    // Update the state
    dispatch({ type: "REPLACE_ALL_DATA", payload: newState });
    
    // Save to localStorage immediately
    try {
      localStorage.setItem("transactionState", JSON.stringify(newState));
      localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      console.log("Saved imported data to localStorage");
      
      // IMPORTANT: After importing data, always sync to Supabase
      if (user && isOnline) {
        console.log("Auto-syncing imported data to Supabase");
        syncToSupabase().catch(err => {
          console.error("Failed to auto-sync after import:", err);
        });
      }
    } catch (error) {
      console.error("Failed to save to localStorage after importData:", error);
    }
  };

  // Function to directly sync current state to Supabase
  const syncToSupabase = async (): Promise<boolean> => {
    if (!user || !isOnline) {
      console.log("Cannot sync to Supabase: user not logged in or offline");
      return false;
    }
    
    console.log(`Syncing ${state.transactions.length} transactions to Supabase`);
    
    try {
      // Delete existing transactions for this user
      const { error: deleteTransactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email);
      
      if (deleteTransactionsError) {
        console.error("Failed to delete existing transactions:", deleteTransactionsError);
        return false;
      }
      
      // Delete existing categories for this user
      const { error: deleteCategoriesError } = await supabase
        .from('categories')
        .delete()
        .eq('user_email', user.email);
      
      if (deleteCategoriesError) {
        console.error("Failed to delete existing categories:", deleteCategoriesError);
        return false;
      }
      
      // Insert all transactions in batches
      if (state.transactions.length > 0) {
        const batchSize = 50;
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
          
          const { error } = await supabase
            .from('transactions')
            .insert(transactionRows);
          
          if (error) {
            console.error(`Failed to insert transaction batch ${i + 1}/${batches}:`, error);
            return false;
          }
        }
      }
      
      // Insert all categories
      if (state.categories.length > 0) {
        const categoryRows = state.categories.map(category => ({
          user_email: user.email,
          category_id: category.id,
          name: category.name,
          type: category.type,
          color: category.color
        }));
        
        const { error } = await supabase
          .from('categories')
          .insert(categoryRows);
        
        if (error) {
          console.error("Failed to insert categories:", error);
          return false;
        }
      }
      
      console.log("Successfully synced all data to Supabase");
      return true;
    } catch (error) {
      console.error("Error in syncToSupabase:", error);
      return false;
    }
  };

  // Deduplicate transactions in the state
  const handleDeduplicate = () => {
    const deduplicatedState = deduplicate();
    dispatch({ type: "SET_STATE", payload: deduplicatedState });
  };

  // Make sure to save state to localStorage whenever it changes
  useEffect(() => {
    if (state.transactions && state.transactions.length > 0) {
      try {
        console.log(`Saving state to localStorage: ${state.transactions.length} transactions`);
        localStorage.setItem("transactionState", JSON.stringify(state));
        localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      } catch (error) {
        console.error("Failed to save state to localStorage:", error);
      }
    }
  }, [state]);

  return (
    <TransactionContext.Provider
      value={{
        state,
        dispatch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        getTransactionsByType,
        getCategoriesByType,
        getCategoryById,
        getTotalByType,
        importData,
        replaceAllData,
        lastSyncTime,
        refreshData,
        deduplicate: handleDeduplicate,
        isOnline,
        pendingSyncCount,
        isLoading,
        syncToSupabase
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
