
import React, { useReducer, useEffect, useState, useCallback } from "react";
import { TransactionContext } from "./context";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Transaction, Category } from "@/types";
import { TransactionState } from "./types";
import { v4 as uuidv4 } from "uuid";
import { allDefaultCategories } from "./defaultCategories";
import { supabase } from "@/integrations/supabase/client";

const initialState: TransactionState = {
  transactions: [],
  categories: allDefaultCategories,
  nextTransactionId: 1,
  nextCategoryId: 100
};

const transactionReducer = (state: TransactionState, action: any): TransactionState => {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return { 
        ...state, 
        transactions: [...state.transactions, action.payload] 
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case "ADD_CATEGORY":
      return { 
        ...state, 
        categories: [...state.categories, action.payload] 
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
    case "REPLACE_ALL_DATA":
      if (!action.payload.categories || action.payload.categories.length === 0) {
        action.payload.categories = allDefaultCategories;
      }
      return action.payload;
    default:
      return state;
  }
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const [syncNeeded, setSyncNeeded] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const saveToLocalStorage = useCallback((data: TransactionState) => {
    if (!data) {
      console.error("Invalid data provided to saveToLocalStorage");
      return;
    }
    try {
      console.log("Saving to localStorage:", data);
      const dataToSave = {
        transactions: data.transactions || [],
        categories: data.categories && data.categories.length > 0 
          ? data.categories 
          : allDefaultCategories,
        nextTransactionId: data.nextTransactionId || 1,
        nextCategoryId: data.nextCategoryId || 100
      };
      
      localStorage.setItem("transactionState", JSON.stringify(dataToSave));
      
      const savedData = localStorage.getItem("transactionState");
      if (!savedData) {
        throw new Error("Failed to verify data was saved to localStorage");
      }
      
      const parsedData = JSON.parse(savedData);
      if (!Array.isArray(parsedData.categories) || parsedData.categories.length === 0) {
        console.warn("Categories not saved correctly, attempting recovery");
        const recovery = {
          ...parsedData,
          categories: allDefaultCategories
        };
        localStorage.setItem("transactionState", JSON.stringify(recovery));
      }
      
      if (user) {
        setSyncNeeded(true);
        const newTransactions = data.transactions.filter(t => 
          !t.syncedAt || (t.updatedAt && new Date(t.syncedAt) < new Date(t.updatedAt))
        );
        setPendingSyncCount(newTransactions.length);
      }
      
    } catch (error) {
      console.error("Failed to save transactions to localStorage", error);
      toast.error("Failed to save transactions. Storage might be full.");
      
      try {
        const minimalData = {
          transactions: data.transactions || [],
          categories: allDefaultCategories
        };
        localStorage.setItem("transactionState", JSON.stringify(minimalData));
      } catch (backupError) {
        console.error("Even backup save failed", backupError);
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("transactionState");
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          
          if (!parsedState) {
            throw new Error("Invalid state format in localStorage");
          }
          
          if (!Array.isArray(parsedState.categories) || parsedState.categories.length === 0) {
            parsedState.categories = allDefaultCategories;
          }
          
          const validState = {
            transactions: Array.isArray(parsedState.transactions) ? parsedState.transactions : [],
            categories: parsedState.categories,
            nextTransactionId: parsedState.nextTransactionId || 1,
            nextCategoryId: parsedState.nextCategoryId || 100
          };
          
          console.log("Loading from localStorage:", validState);
          
          dispatch({ 
            type: "REPLACE_ALL_DATA", 
            payload: validState
          });
          
          setLoadedFromStorage(true);
        } catch (parseError) {
          console.error("Failed to parse state from localStorage", parseError);
          dispatch({ 
            type: "REPLACE_ALL_DATA", 
            payload: initialState
          });
        }
      } else {
        console.log("No saved state found, using initial state with default categories");
        dispatch({ 
          type: "REPLACE_ALL_DATA", 
          payload: initialState
        });
      }
    } catch (error) {
      console.error("Critical error loading state from localStorage", error);
      toast.error("There was a problem loading your data. Default categories will be used.");
      dispatch({ 
        type: "REPLACE_ALL_DATA", 
        payload: initialState
      });
    }
  }, []);

  useEffect(() => {
    if (syncNeeded && user && isOnline) {
      const syncData = async () => {
        try {
          console.log("Auto-syncing data to Supabase...");
          await syncToSupabase();
          setSyncNeeded(false);
          setPendingSyncCount(0);
          setLastSyncTime(new Date());
          toast.success("Data synced to cloud");
        } catch (error) {
          console.error("Auto-sync failed:", error);
        }
      };
      
      syncData();
    }
  }, [syncNeeded, user, isOnline]);

  useEffect(() => {
    if (loadedFromStorage) {
      if (!state.categories || state.categories.length === 0) {
        console.warn("Attempting to save with empty categories, adding defaults");
        const stateWithDefaults = {
          ...state,
          categories: allDefaultCategories
        };
        saveToLocalStorage(stateWithDefaults);
      } else {
        saveToLocalStorage(state);
      }
    }
  }, [state, saveToLocalStorage, loadedFromStorage]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user && pendingSyncCount > 0) {
        setSyncNeeded(true);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, pendingSyncCount]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-updates')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'transactions',
        filter: `user_email=eq.${user.email}`
      }, (payload) => {
        console.log('Database change received:', payload);
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const syncToSupabase = async () => {
    if (!user || !isOnline) {
      return false;
    }

    try {
      const { data: existingTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', user.email);
      
      if (fetchError) throw fetchError;
      
      const existingTransactionMap = new Map();
      existingTransactions?.forEach(tx => {
        existingTransactionMap.set(tx.transaction_id, tx);
      });
      
      const transactionsToSync = state.transactions.map(tx => {
        const existing = existingTransactionMap.get(tx.id);
        const now = new Date().toISOString();
        return {
          ...tx,
          syncedAt: now,
          updatedAt: tx.updatedAt || now
        };
      });
      
      const { error: categoriesDeleteError } = await supabase
        .from('categories')
        .delete()
        .eq('user_email', user.email);
      
      if (categoriesDeleteError) throw categoriesDeleteError;
      
      const categoryRows = state.categories.map(category => ({
        user_email: user.email,
        category_id: category.id,
        name: category.name,
        type: category.type,
        color: category.color
      }));
      
      const { error: categoriesInsertError } = await supabase
        .from('categories')
        .insert(categoryRows);
      
      if (categoriesInsertError) throw categoriesInsertError;
      
      const { error: transactionsDeleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email);
      
      if (transactionsDeleteError) throw transactionsDeleteError;
      
      if (transactionsToSync.length > 0) {
        const transactionRows = transactionsToSync.map(transaction => ({
          user_email: user.email,
          transaction_id: transaction.id,
          type: transaction.type,
          category_id: transaction.categoryId,
          amount: transaction.amount,
          description: transaction.description || '',
          date: transaction.date,
          emotional_state: transaction.emotionalState || 'neutral'
        }));
        
        const { error: transactionsInsertError } = await supabase
          .from('transactions')
          .insert(transactionRows);
        
        if (transactionsInsertError) throw transactionsInsertError;
      }
      
      const updatedTransactions = state.transactions.map(tx => ({
        ...tx,
        syncedAt: new Date().toISOString()
      }));
      
      dispatch({
        type: "REPLACE_ALL_DATA",
        payload: {
          ...state,
          transactions: updatedTransactions
        }
      });
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      toast.error('Failed to sync data to cloud');
      return false;
    }
  };

  const refreshData = async () => {
    if (!user || !isOnline) {
      return false;
    }

    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', user.email);
      
      if (transactionsError) throw transactionsError;
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_email', user.email);
      
      if (categoriesError) throw categoriesError;
      
      if ((!transactionsData || transactionsData.length === 0) &&
          (!categoriesData || categoriesData.length === 0)) {
        return syncToSupabase();
      }
      
      const transactions = transactionsData.map(t => ({
        id: t.transaction_id,
        type: t.type as 'income' | 'expense',
        categoryId: t.category_id,
        amount: parseFloat(t.amount),
        description: t.description,
        date: t.date,
        emotionalState: t.emotional_state || 'neutral',
        syncedAt: new Date().toISOString()
      }));
      
      let categories = categoriesData.length > 0 
        ? categoriesData.map(c => ({
            id: c.category_id,
            name: c.name,
            type: c.type as 'income' | 'expense',
            color: c.color || '#cccccc'
          }))
        : allDefaultCategories;
      
      dispatch({
        type: "REPLACE_ALL_DATA",
        payload: {
          transactions,
          categories,
          nextTransactionId: state.nextTransactionId,
          nextCategoryId: state.nextCategoryId
        }
      });
      
      setLastSyncTime(new Date());
      toast.success("Data synchronized from cloud");
      return true;
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
      toast.error('Failed to refresh data from cloud');
      return false;
    }
  };

  const deduplicate = () => {
    const uniqueTransactions = Array.from(
      new Map(state.transactions.map(item => [item.id, item])).values()
    );
    
    if (uniqueTransactions.length !== state.transactions.length) {
      dispatch({
        type: "REPLACE_ALL_DATA",
        payload: {
          ...state,
          transactions: uniqueTransactions
        }
      });
      toast.success(`Removed ${state.transactions.length - uniqueTransactions.length} duplicate transactions`);
    }
    return true;
  };

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { 
      ...transaction, 
      id: uuidv4(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });
    toast.success("Transaction added successfully");
    setSyncNeeded(true);
    setPendingSyncCount(prevCount => prevCount + 1);
    return true;
  };

  const updateTransaction = (transaction: Transaction) => {
    const updatedTransaction = {
      ...transaction,
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: "UPDATE_TRANSACTION", payload: updatedTransaction });
    toast.success("Transaction updated successfully");
    setSyncNeeded(true);
    setPendingSyncCount(prevCount => prevCount + 1);
    return true;
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    toast.success("Transaction deleted successfully");
    setSyncNeeded(true);
    return true;
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: uuidv4() };
    dispatch({ type: "ADD_CATEGORY", payload: newCategory });
    toast.success("Category added successfully");
    setSyncNeeded(true);
    return true;
  };

  const deleteCategory = (id: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: id });
    toast.success("Category deleted successfully");
    setSyncNeeded(true);
    return true;
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
        getTransactionsByType: (type) => state.transactions.filter(t => t.type === type),
        getCategoriesByType: (type) => state.categories.filter(c => c.type === type),
        getCategoryById: (id) => state.categories.find(c => c.id === id),
        getTotalByType: (type) => state.transactions
          .filter(t => t.type === type)
          .reduce((acc, t) => acc + t.amount, 0),
        importData: (data) => dispatch({ type: "REPLACE_ALL_DATA", payload: data }),
        replaceAllData: (data) => dispatch({ type: "REPLACE_ALL_DATA", payload: data }),
        lastSyncTime,
        refreshData,
        deduplicate,
        isOnline,
        pendingSyncCount
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
