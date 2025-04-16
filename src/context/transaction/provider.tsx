
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
          // Only update state if we have more or equal transactions than current state
          // This helps preserve local data when cloud data might be missing
          if (refreshedData.transactions.length >= state.transactions.length) {
            console.log(`Updating state with ${refreshedData.transactions.length} transactions from cloud refresh`);
            dispatch({ type: "SET_STATE", payload: refreshedData });
            return true;
          } else {
            console.log(`Keeping current state with ${state.transactions.length} transactions instead of refreshed data with ${refreshedData.transactions.length} transactions`);
            
            // Instead of ignoring cloud data, merge it with local data to avoid loss
            const mergedTransactions = [...state.transactions];
            
            // Add any transactions from cloud that aren't in local state
            refreshedData.transactions.forEach(cloudTx => {
              if (!mergedTransactions.some(localTx => localTx.id === cloudTx.id)) {
                mergedTransactions.push(cloudTx);
              }
            });
            
            const mergedState = {
              ...state,
              transactions: mergedTransactions
            };
            
            console.log(`Merged state now has ${mergedTransactions.length} transactions`);
            dispatch({ type: "SET_STATE", payload: mergedState });
            return true;
          }
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
    } catch (error) {
      console.error("Failed to save to localStorage after importData:", error);
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
        isLoading
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
