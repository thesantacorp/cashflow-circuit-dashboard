
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
        dispatch({ type: "SET_STATE", payload: loadedData });
      }
    };

    initializeData();
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    const handleDataRefresh = () => {
      refreshData(true); // ALWAYS use silent refresh for realtime updates to prevent toast spam
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
        // Only update state if we have more or equal transactions than current state
        // This helps preserve local data when cloud data might be missing
        if (refreshedData.transactions.length >= state.transactions.length) {
          dispatch({ type: "SET_STATE", payload: refreshedData });
          return true;
        } else {
          console.log(`Keeping current state with ${state.transactions.length} transactions instead of refreshed data with ${refreshedData.transactions.length} transactions`);
          return false;
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
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
  };

  // Import partial data into the state
  const importData = (data: Partial<TransactionState>) => {
    const newState = {
      ...state,
      ...data
    };
    console.log(`Importing partial data, resulting in ${newState.transactions.length} transactions and ${newState.categories.length} categories`);
    dispatch({ type: "REPLACE_ALL_DATA", payload: newState });
  };

  // Deduplicate transactions in the state
  const handleDeduplicate = () => {
    const deduplicatedState = deduplicate();
    dispatch({ type: "SET_STATE", payload: deduplicatedState });
  };

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
        isLoading
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
