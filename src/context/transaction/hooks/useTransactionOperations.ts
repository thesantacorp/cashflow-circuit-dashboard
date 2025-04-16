
import { useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction } from "@/types";

// Simple reducer for local state management
const transactionReducer = (state: any, action: any) => {
  let newState;
  
  switch (action.type) {
    case "ADD_TRANSACTION":
      newState = { 
        ...state, 
        transactions: [...state.transactions, action.payload] 
      };
      console.log("ADD_TRANSACTION - New state:", newState);
      return newState;
      
    case "UPDATE_TRANSACTION":
      newState = {
        ...state,
        transactions: state.transactions.map((t: any) => 
          t.id === action.payload.id ? action.payload : t
        )
      };
      console.log("UPDATE_TRANSACTION - New state:", newState);
      return newState;
      
    case "DELETE_TRANSACTION":
      newState = {
        ...state,
        transactions: state.transactions.filter((t: any) => t.id !== action.payload)
      };
      console.log("DELETE_TRANSACTION - New state:", newState);
      return newState;
      
    case "ADD_CATEGORY":
      newState = { 
        ...state, 
        categories: [...state.categories, action.payload] 
      };
      console.log("ADD_CATEGORY - New state:", newState);
      return newState;
      
    case "DELETE_CATEGORY":
      newState = {
        ...state,
        categories: state.categories.filter((c: any) => c.id !== action.payload)
      };
      console.log("DELETE_CATEGORY - New state:", newState);
      return newState;
      
    default:
      return state;
  }
};

// Initial state
const initialState = {
  transactions: [],
  categories: []
};

export function useTransactionOperations() {
  // Get initial state from localStorage
  const getInitialState = () => {
    try {
      const savedState = localStorage.getItem("transactionState");
      console.log("Loading state from localStorage:", savedState);
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      return initialState;
    }
  };

  const [state, dispatch] = useReducer(
    transactionReducer,
    getInitialState()
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      console.log("Saving state to localStorage:", state);
      localStorage.setItem("transactionState", JSON.stringify(state));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }, [state]);

  // Add a transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    // Force manual save to localStorage for redundancy
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify(initialState));
      const updatedState = {
        ...currentState,
        transactions: [...currentState.transactions, newTransaction]
      };
      console.log("Force saving transaction to localStorage:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving transaction to localStorage:", error);
    }
    
    toast.success("Transaction added successfully");
    return true;
  };

  // Update a transaction
  const updateTransaction = (transaction: Transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    
    // Force manual save to localStorage for redundancy
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify(initialState));
      const updatedState = {
        ...currentState,
        transactions: currentState.transactions.map((t: Transaction) => 
          t.id === transaction.id ? transaction : t
        )
      };
      console.log("Force saving updated transaction to localStorage:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving updated transaction to localStorage:", error);
    }
    
    toast.success("Transaction updated successfully");
    return true;
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    
    // Force manual save to localStorage for redundancy
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify(initialState));
      const updatedState = {
        ...currentState,
        transactions: currentState.transactions.filter((t: Transaction) => t.id !== id)
      };
      console.log("Force saving after transaction deletion to localStorage:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving after transaction deletion to localStorage:", error);
    }
    
    toast.success("Transaction deleted successfully");
    return true;
  };

  // Add a category
  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: uuidv4() };
    
    dispatch({
      type: "ADD_CATEGORY",
      payload: newCategory,
    });
    
    // Force manual save to localStorage for redundancy
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify(initialState));
      const updatedState = {
        ...currentState,
        categories: [...currentState.categories, newCategory]
      };
      console.log("Force saving new category to localStorage:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving new category to localStorage:", error);
    }
    
    toast.success("Category added successfully");
    return true;
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    
    // Force manual save to localStorage for redundancy
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify(initialState));
      const updatedState = {
        ...currentState,
        categories: currentState.categories.filter((c: Category) => c.id !== id)
      };
      console.log("Force saving after category deletion to localStorage:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving after category deletion to localStorage:", error);
    }
    
    return true;
  };
  
  return {
    state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  };
}
