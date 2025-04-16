
import { useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";

// Simple reducer for local state management
const transactionReducer = (state: any, action: any) => {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return { ...state, transactions: [...state.transactions, action.payload] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t: any) => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t: any) => t.id !== action.payload)
      };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c: any) => c.id !== action.payload)
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  transactions: [],
  categories: []
};

// Helper function to safely access localStorage
const safeGetStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    return JSON.parse(value);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Helper function to safely update localStorage
const safeSetStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export function useTransactionOperations() {
  // Load initial state from localStorage with safety checks
  const savedState = safeGetStorage("transactionState", initialState);
  
  const [state, dispatch] = useReducer(
    transactionReducer,
    savedState
  );

  // Wrap dispatch to also update localStorage
  const persistingDispatch = (action: any) => {
    dispatch(action);
    
    // Immediately update localStorage after state changes
    // (This ensures we don't rely solely on the useEffect for persistence)
    if (typeof window !== 'undefined') {
      // Manually calculate the new state
      const newState = transactionReducer(
        safeGetStorage("transactionState", initialState), 
        action
      );
      safeSetStorage("transactionState", newState);
      console.log("Directly updated localStorage:", newState);
    }
  };

  // Save state to localStorage whenever it changes (backup persistence mechanism)
  useEffect(() => {
    safeSetStorage("transactionState", state);
    console.log("useEffect: Saved state to localStorage:", state);
  }, [state]);

  // Add a transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { 
      ...transaction, 
      id: uuidv4() 
    };
    
    persistingDispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    toast.success("Transaction added successfully");
    return true;
  };

  // Update a transaction
  const updateTransaction = (transaction: Transaction) => {
    persistingDispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    toast.success("Transaction updated successfully");
    return true;
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    persistingDispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    toast.success("Transaction deleted successfully");
    return true;
  };

  // Add a category
  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: uuidv4() };
    persistingDispatch({
      type: "ADD_CATEGORY",
      payload: newCategory,
    });
    
    toast.success("Category added successfully");
    return true;
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    persistingDispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    return true;
  };
  
  return {
    state,
    dispatch: persistingDispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  };
}
