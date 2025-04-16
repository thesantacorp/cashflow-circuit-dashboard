
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
        dispatch({ type: "SET_STATE", payload: loadedData });
      }
    };

    initializeData();
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    const handleDataRefresh = () => {
      refreshData();
    };

    const channel = setupRealtimeSubscription(handleDataRefresh);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  // Function to refresh data from Supabase
  const refreshData = async (): Promise<boolean> => {
    const refreshedData = await refreshDataFromSupabase(state);
    if (refreshedData) {
      dispatch({ type: "SET_STATE", payload: refreshedData });
      return true;
    }
    return false;
  };

  // Replace all data in the state
  const replaceAllData = (data: TransactionState) => {
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
  };

  // Import partial data into the state
  const importData = (data: Partial<TransactionState>) => {
    const newState = {
      ...state,
      ...data
    };
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
