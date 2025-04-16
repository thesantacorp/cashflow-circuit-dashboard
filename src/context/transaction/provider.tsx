import React, { useReducer, useEffect, useState, useCallback } from "react";
import { TransactionContext } from "./context";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Transaction, Category } from "@/types";
import { TransactionState } from "./types";
import { v4 as uuidv4 } from "uuid";

const initialState: TransactionState = {
  transactions: [],
  categories: [],
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
      return action.payload;
    default:
      return state;
  }
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const saveToLocalStorage = useCallback((data: TransactionState) => {
    try {
      localStorage.setItem("transactionState", JSON.stringify({
        transactions: data.transactions,
        categories: data.categories
      }));
    } catch (error) {
      console.error("Failed to save transactions to localStorage", error);
      toast.error("Failed to save transactions. Storage might be full.");
    }
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem("transactionState");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ 
          type: "REPLACE_ALL_DATA", 
          payload: {
            transactions: parsedState.transactions || [],
            categories: parsedState.categories || []
          }
        });
      } catch (error) {
        console.error("Failed to load transactions from localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    saveToLocalStorage(state);
  }, [state, saveToLocalStorage]);

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
