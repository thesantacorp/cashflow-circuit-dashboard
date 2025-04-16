
import { useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";

// Simple reducer for local state management
const transactionReducer = (state: any, action: any) => {
  let newState;
  
  switch (action.type) {
    case "ADD_TRANSACTION":
      newState = { ...state, transactions: [...state.transactions, action.payload] };
      break;
    case "UPDATE_TRANSACTION":
      newState = {
        ...state,
        transactions: state.transactions.map((t: any) => 
          t.id === action.payload.id ? action.payload : t
        )
      };
      break;
    case "DELETE_TRANSACTION":
      newState = {
        ...state,
        transactions: state.transactions.filter((t: any) => t.id !== action.payload)
      };
      break;
    case "ADD_CATEGORY":
      newState = { ...state, categories: [...state.categories, action.payload] };
      break;
    case "DELETE_CATEGORY":
      newState = {
        ...state,
        categories: state.categories.filter((c: any) => c.id !== action.payload)
      };
      break;
    default:
      return state;
  }
  
  console.log("Reducer updated state:", newState);
  return newState;
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
    console.log(`safeSetStorage: Updated ${key} in localStorage`, value);
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export function useTransactionOperations() {
  console.log("Initializing useTransactionOperations hook");
  
  // Load initial state from localStorage with safety checks
  const savedState = safeGetStorage("transactionState", initialState);
  console.log("Initial state loaded from localStorage:", savedState);
  
  const [state, dispatch] = useReducer(
    transactionReducer,
    savedState
  );

  // Wrap dispatch to also update localStorage
  const persistingDispatch = (action: any) => {
    console.log("persistingDispatch called with action:", action);
    dispatch(action);
    
    // Immediately update localStorage after state changes
    if (typeof window !== 'undefined') {
      // Manually calculate the new state
      const newState = transactionReducer(
        safeGetStorage("transactionState", initialState), 
        action
      );
      safeSetStorage("transactionState", newState);
      console.log("Directly updated localStorage with new state");
    }
  };

  // Save state to localStorage whenever it changes (backup persistence mechanism)
  useEffect(() => {
    console.log("State changed, saving to localStorage:", state);
    safeSetStorage("transactionState", state);
  }, [state]);

  // Add a transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    console.log("Adding transaction:", transaction);
    
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
