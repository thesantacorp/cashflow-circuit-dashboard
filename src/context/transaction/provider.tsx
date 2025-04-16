
import React, { useReducer, useEffect, useState, useCallback } from "react";
import { TransactionContext } from "./context";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Transaction, Category } from "@/types";
import { TransactionState } from "./types";
import { v4 as uuidv4 } from "uuid";
import { allDefaultCategories } from "./defaultCategories";

// Initialize with default categories to ensure they're always available
const initialState: TransactionState = {
  transactions: [],
  categories: allDefaultCategories,
  nextTransactionId: 1,
  nextCategoryId: 100 // Starting after default categories
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
      // Ensure we have at least the default categories
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

  // Improved localStorage saving with validation
  const saveToLocalStorage = useCallback((data: TransactionState) => {
    if (!data) {
      console.error("Invalid data provided to saveToLocalStorage");
      return;
    }
    try {
      console.log("Saving to localStorage:", data);
      // Ensure we never save empty categories
      const dataToSave = {
        transactions: data.transactions || [],
        categories: data.categories && data.categories.length > 0 
          ? data.categories 
          : allDefaultCategories,
        nextTransactionId: data.nextTransactionId || 1,
        nextCategoryId: data.nextCategoryId || 100
      };
      
      localStorage.setItem("transactionState", JSON.stringify(dataToSave));
      
      // Verify the data was saved correctly
      const savedData = localStorage.getItem("transactionState");
      if (!savedData) {
        throw new Error("Failed to verify data was saved to localStorage");
      }
      
      const parsedData = JSON.parse(savedData);
      if (!Array.isArray(parsedData.categories) || parsedData.categories.length === 0) {
        console.warn("Categories not saved correctly, attempting recovery");
        // Recovery attempt
        const recovery = {
          ...parsedData,
          categories: allDefaultCategories
        };
        localStorage.setItem("transactionState", JSON.stringify(recovery));
      }
      
    } catch (error) {
      console.error("Failed to save transactions to localStorage", error);
      toast.error("Failed to save transactions. Storage might be full.");
      
      // Last resort: Try to save just the essential data
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
  }, []);

  // Load state from localStorage with improved error handling
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("transactionState");
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          
          // Validate the parsed state
          if (!parsedState) {
            throw new Error("Invalid state format in localStorage");
          }
          
          // Ensure categories exist
          if (!Array.isArray(parsedState.categories) || parsedState.categories.length === 0) {
            parsedState.categories = allDefaultCategories;
          }
          
          // Ensure other required properties exist
          const validState = {
            transactions: Array.isArray(parsedState.transactions) ? parsedState.transactions : [],
            categories: parsedState.categories,
            nextTransactionId: parsedState.nextTransactionId || 1,
            nextCategoryId: parsedState.nextCategoryId || 100
          };
          
          // Log the recovered data
          console.log("Loading from localStorage:", validState);
          
          dispatch({ 
            type: "REPLACE_ALL_DATA", 
            payload: validState
          });
          
          setLoadedFromStorage(true);
        } catch (parseError) {
          console.error("Failed to parse state from localStorage", parseError);
          // Use initial state with default categories if parsing fails
          dispatch({ 
            type: "REPLACE_ALL_DATA", 
            payload: initialState
          });
        }
      } else {
        console.log("No saved state found, using initial state with default categories");
        // If no saved state exists, explicitly set the initial state
        dispatch({ 
          type: "REPLACE_ALL_DATA", 
          payload: initialState
        });
      }
    } catch (error) {
      console.error("Critical error loading state from localStorage", error);
      toast.error("There was a problem loading your data. Default categories will be used.");
      // Force reset to initial state with default categories
      dispatch({ 
        type: "REPLACE_ALL_DATA", 
        payload: initialState
      });
    }
  }, []);

  // Save state to localStorage with validation before saving
  useEffect(() => {
    // Only save after the initial load to prevent overwriting with empty state
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

  // Online/Offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });
    toast.success("Transaction added successfully");
    return true;
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: "UPDATE_TRANSACTION", payload: transaction });
    toast.success("Transaction updated successfully");
    return true;
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    toast.success("Transaction deleted successfully");
    return true;
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: uuidv4() };
    dispatch({ type: "ADD_CATEGORY", payload: newCategory });
    toast.success("Category added successfully");
    return true;
  };

  const deleteCategory = (id: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: id });
    toast.success("Category deleted successfully");
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
        lastSyncTime: null,
        refreshData: async () => true,
        deduplicate: () => true,
        isOnline,
        pendingSyncCount: 0
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
