import React, { useReducer, useEffect, useCallback, useState } from "react";
import { TransactionContext } from "./context";
import { supabase } from "@/integrations/supabase/client";
import { TransactionState } from "./types";
import { transactionReducer, initialState } from "./reducer";
import { useTransactionAuth } from "./hooks/useTransactionAuth";
import { useSupabaseData } from "./hooks/useSupabaseData";
import { useTransactionActions } from "./hooks/useTransactionActions";
import { useTransactionUtils } from "./hooks/useTransactionUtils";
import { Transaction, Category } from "@/types";
import { toast } from "sonner";

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const [isPerformingMajorOperation, setIsPerformingMajorOperation] = useState(false);
  
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
    deleteTransaction: deleteTransactionAction,
    addCategory,
    deleteCategory
  } = useTransactionActions(user, isOnline, setPendingSyncCount);

  const {
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    deduplicate: deduplicateUtils,
    cleanImportedTransactions
  } = useTransactionUtils(state);

  useEffect(() => {
    const initializeData = async () => {
      const loadedData = await loadInitialData();
      if (loadedData) {
        console.log(`Initializing with ${loadedData.transactions.length} transactions and ${loadedData.categories.length} categories`);
        
        if (state.transactions.length > 0) {
          console.log(`Merging local state with ${state.transactions.length} transactions with cloud data with ${loadedData.transactions.length} transactions`);
          
          const mergedTransactions = [...state.transactions];
          
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
          
          const dedupedState = deduplicateUtils();
          dispatch({ type: "SET_STATE", payload: dedupedState });
        } else {
          dispatch({ type: "SET_STATE", payload: loadedData });
        }
      }
    };

    initializeData();
  }, [user]);

  useEffect(() => {
    const handleDataRefresh = async () => {
      await refreshData(true);
      handleDeduplicate();
    };

    const channel = setupRealtimeSubscription(handleDataRefresh);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const refreshData = async (silent = true): Promise<boolean> => {
    try {
      if (!user || !navigator.onLine) {
        return false;
      }
      
      const refreshedData = await refreshDataFromSupabase(state, silent);
      if (refreshedData) {
        if (state.transactions.length > 0) {
          const existingTransactionsMap = new Map();
          state.transactions.forEach(tx => {
            existingTransactionsMap.set(tx.id, tx);
          });
          
          const cloudTransactionsMap = new Map();
          refreshedData.transactions.forEach(tx => {
            cloudTransactionsMap.set(tx.id, tx);
          });
          
          const mergedTransactions = [...state.transactions];
          
          refreshedData.transactions.forEach(cloudTx => {
            if (!existingTransactionsMap.has(cloudTx.id)) {
              mergedTransactions.push(cloudTx);
            }
          });
          
          const mergedState = {
            ...state,
            transactions: mergedTransactions,
            categories: refreshedData.categories.length > 0 ? refreshedData.categories : state.categories
          };
          
          dispatch({ type: "SET_STATE", payload: mergedState });
          handleDeduplicate();
          return true;
        } else {
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

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      console.log(`Attempting to delete transaction: ${id}`);
      
      dispatch({ type: "DELETE_TRANSACTION", payload: id });
      
      const dedupedState = deduplicateUtils();
      dispatch({ type: "SET_STATE", payload: dedupedState });
      
      try {
        localStorage.setItem("transactionState", JSON.stringify(dedupedState));
        localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      } catch (error) {
        console.error("Failed to save to localStorage after transaction deletion:", error);
      }
      
      if (user && isOnline) {
        console.log(`Deleting transaction ${id} from Supabase`);
        const success = await deleteTransactionAction(id);
        
        if (success) {
          console.log(`Transaction ${id} deleted from Supabase`);
          
          await syncToSupabase();
          
          return true;
        } else {
          console.error(`Failed to delete transaction ${id} from Supabase`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  };

  const replaceAllData = (data: TransactionState) => {
    console.log(`Replacing all data with ${data.transactions.length} transactions and ${data.categories.length} categories`);
    
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
    
    try {
      localStorage.setItem("transactionState", JSON.stringify(data));
      localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      console.log("Saved replaced data to localStorage");
      
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

  const importData = async (data: Partial<TransactionState>) => {
    setIsPerformingMajorOperation(true);
    try {
      const dedupedState = deduplicateUtils();
      
      const incomingTransactions = data.transactions || [];
      
      const uniqueIncomingTransactions = cleanImportedTransactions(incomingTransactions);
      
      console.log(`Filtering out potential duplicates, reduced from ${incomingTransactions.length} to ${uniqueIncomingTransactions.length} transactions`);
      
      const newState = {
        ...dedupedState,
        transactions: [...dedupedState.transactions, ...uniqueIncomingTransactions]
      };
      
      console.log(`Importing partial data, resulting in ${newState.transactions.length} transactions`);
      
      dispatch({ type: "REPLACE_ALL_DATA", payload: newState });
      
      try {
        localStorage.setItem("transactionState", JSON.stringify(newState));
        localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
        console.log("Saved imported data to localStorage");
        
        toast.success(`Imported ${uniqueIncomingTransactions.length} new transactions`);
        
        if (user && isOnline) {
          console.log("Auto-syncing imported data to Supabase");
          await syncToSupabase();
          
          await refreshData(false);
        }
      } catch (error) {
        console.error("Failed to save to localStorage after importData:", error);
      }
    } catch (error) {
      console.error("Error in importData:", error);
      toast.error("Failed to import data");
    } finally {
      setIsPerformingMajorOperation(false);
    }
  };

  const syncToSupabase = async (): Promise<boolean> => {
    if (!user || !isOnline) {
      console.log("Cannot sync to Supabase: user not logged in or offline");
      return false;
    }
    
    setIsPerformingMajorOperation(true);
    try {
      console.log(`Syncing ${state.transactions.length} transactions to Supabase`);
      
      const dedupedState = deduplicateUtils();
      if (dedupedState.transactions.length < state.transactions.length) {
        console.log(`Found and removed ${state.transactions.length - dedupedState.transactions.length} duplicate transactions before sync`);
        dispatch({ type: "SET_STATE", payload: dedupedState });
      }
      
      try {
        const { error: deleteTransactionsError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_email', user.email);
        
        if (deleteTransactionsError) {
          console.error("Failed to delete existing transactions:", deleteTransactionsError);
          return false;
        }
      } catch (deleteError) {
        console.error("Exception while deleting transactions:", deleteError);
        return false;
      }
      
      try {
        const { error: deleteCategoriesError } = await supabase
          .from('categories')
          .delete()
          .eq('user_email', user.email);
        
        if (deleteCategoriesError) {
          console.error("Failed to delete existing categories:", deleteCategoriesError);
          return false;
        }
      } catch (deleteError) {
        console.error("Exception while deleting categories:", deleteError);
        return false;
      }
      
      const batchSize = 25;
      const batches = Math.ceil(dedupedState.transactions.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, dedupedState.transactions.length);
        const batch = dedupedState.transactions.slice(start, end);
        
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
        
        try {
          const { error } = await supabase
            .from('transactions')
            .insert(transactionRows);
          
          if (error) {
            console.error(`Failed to insert transaction batch ${i + 1}/${batches}:`, error);
            return false;
          }
        } catch (insertError) {
          console.error(`Exception in transaction batch ${i + 1}/${batches}:`, insertError);
          return false;
        }
      }
      
      if (dedupedState.categories.length > 0) {
        const categoryRows = dedupedState.categories.map(category => ({
          user_email: user.email,
          category_id: category.id,
          name: category.name,
          type: category.type,
          color: category.color || '#cccccc'
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
    } finally {
      setIsPerformingMajorOperation(false);
    }
  };

  const handleDeduplicate = () => {
    const deduplicatedState = deduplicateUtils();
    dispatch({ type: "SET_STATE", payload: deduplicatedState });
  };

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
        isLoading: isLoading || isPerformingMajorOperation,
        syncToSupabase
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
