
import { useReducer, useEffect, useCallback } from "react";
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

// Helper function to safely save to localStorage
const safeLocalStorageSave = (key: string, data: any): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    
    // Verify the save was successful
    const saved = localStorage.getItem(key);
    if (!saved) {
      console.error(`Failed to save ${key} to localStorage: item not found after save`);
      return false;
    }
    
    // Parse and verify structure (specifically for transactionState)
    if (key === "transactionState") {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.transactions)) {
        console.error(`Invalid transactions array after save in ${key}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

export function useTransactionOperations() {
  // Get initial state from localStorage with multiple fallbacks
  const getInitialState = useCallback(() => {
    try {
      console.log("Attempting to load state from localStorage");
      const savedState = localStorage.getItem("transactionState");
      
      if (!savedState) {
        console.warn("No transactionState found in localStorage, using empty state");
        return initialState;
      }
      
      const parsedState = JSON.parse(savedState);
      console.log("Successfully loaded state from localStorage:", parsedState);
      
      // Validate state structure
      if (!Array.isArray(parsedState.transactions)) {
        console.error("Invalid transactions array in localStorage");
        return initialState;
      }
      
      if (!Array.isArray(parsedState.categories)) {
        console.error("Invalid categories array in localStorage");
        return initialState;
      }
      
      // Log a summary of the loaded data
      console.log(`Loaded ${parsedState.transactions.length} transactions and ${parsedState.categories.length} categories`);
      
      return parsedState;
    } catch (error) {
      console.error("Critical error loading state from localStorage:", error);
      return initialState;
    }
  }, []);

  const [state, dispatch] = useReducer(
    transactionReducer,
    getInitialState()
  );

  // Primary save method - save state to localStorage whenever it changes
  useEffect(() => {
    if (!state || !state.transactions) {
      console.error("Invalid state structure, cannot save to localStorage");
      return;
    }
    
    console.log(`Saving state to localStorage: ${state.transactions.length} transactions, ${state.categories.length} categories`);
    
    const success = safeLocalStorageSave("transactionState", state);
    if (!success) {
      console.warn("Primary save to localStorage failed, trying backup method");
      
      // Backup method: try to save just the essential data
      try {
        const minimalState = {
          transactions: state.transactions || [],
          categories: state.categories || []
        };
        localStorage.setItem("transactionState", JSON.stringify(minimalState));
        console.log("Backup save to localStorage successful");
        
        // Verify backup save
        const verifyState = localStorage.getItem("transactionState");
        if (verifyState) {
          const parsed = JSON.parse(verifyState);
          console.log(`Verification: localStorage now has ${parsed.transactions?.length} transactions`);
        }
      } catch (error) {
        console.error("Even backup save failed:", error);
      }
    }
    
    // Also save timestamp of last update for sync detection
    localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
  }, [state]);

  // Add a transaction with extensive error handling and verification
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    console.log("Adding new transaction:", newTransaction);
    
    // Update state via reducer
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    // Force immediate save to localStorage as redundancy
    try {
      // Get current state directly from localStorage for consistency
      const currentStateRaw = localStorage.getItem("transactionState");
      const currentState = currentStateRaw 
        ? JSON.parse(currentStateRaw) 
        : { transactions: [], categories: [] };
      
      // Add new transaction to current state
      const updatedTransactions = [...(currentState.transactions || []), newTransaction];
      const updatedState = { 
        ...currentState,
        transactions: updatedTransactions
      };
      
      // Save updated state
      console.log("Force saving after add transaction. Updated state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
      
      // Verify the save
      const verifyStateRaw = localStorage.getItem("transactionState");
      if (verifyStateRaw) {
        const parsedVerify = JSON.parse(verifyStateRaw);
        console.log(`Verify add: localStorage now has ${parsedVerify.transactions?.length} transactions`);
        
        // Double-check that our transaction is in the array
        const found = parsedVerify.transactions.some((t: any) => t.id === newTransaction.id);
        if (!found) {
          console.error("Transaction verification failed: newly added transaction not found in localStorage");
        } else {
          console.log("Transaction verification successful: transaction found in localStorage");
        }
      }
    } catch (error) {
      console.error("Error in redundant save for add transaction:", error);
    }
    
    toast.success("Transaction added successfully");
    return true;
  };

  // Update a transaction with error handling and verification
  const updateTransaction = (transaction: Transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    
    // Force immediate save to localStorage as redundancy
    try {
      const currentStateRaw = localStorage.getItem("transactionState");
      const currentState = currentStateRaw 
        ? JSON.parse(currentStateRaw) 
        : { transactions: [], categories: [] };
      
      // Update transaction in current state
      const updatedTransactions = currentState.transactions.map((t: Transaction) => 
        t.id === transaction.id ? transaction : t
      );
      
      const updatedState = { 
        ...currentState,
        transactions: updatedTransactions
      };
      
      console.log("Force saving after update transaction. Updated state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
      
      // Verify the save
      const verifyStateRaw = localStorage.getItem("transactionState");
      if (verifyStateRaw) {
        const parsedVerify = JSON.parse(verifyStateRaw);
        console.log(`Verify update: localStorage now has ${parsedVerify.transactions?.length} transactions`);
      }
    } catch (error) {
      console.error("Error in redundant save for update transaction:", error);
    }
    
    toast.success("Transaction updated successfully");
    return true;
  };

  // Delete a transaction with error handling and verification
  const deleteTransaction = (id: string) => {
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    
    // Force immediate save to localStorage as redundancy
    try {
      const currentStateRaw = localStorage.getItem("transactionState");
      const currentState = currentStateRaw 
        ? JSON.parse(currentStateRaw) 
        : { transactions: [], categories: [] };
      
      // Remove transaction from current state
      const updatedTransactions = currentState.transactions.filter((t: Transaction) => t.id !== id);
      const updatedState = { 
        ...currentState,
        transactions: updatedTransactions
      };
      
      console.log("Force saving after delete transaction. Updated state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
      
      // Verify the save
      const verifyStateRaw = localStorage.getItem("transactionState");
      if (verifyStateRaw) {
        const parsedVerify = JSON.parse(verifyStateRaw);
        console.log(`Verify delete: localStorage now has ${parsedVerify.transactions?.length} transactions`);
      }
    } catch (error) {
      console.error("Error in redundant save for delete transaction:", error);
    }
    
    toast.success("Transaction deleted successfully");
    return true;
  };

  // Add a category with error handling
  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: uuidv4() };
    
    dispatch({
      type: "ADD_CATEGORY",
      payload: newCategory,
    });
    
    // Force immediate save to localStorage as redundancy
    try {
      const currentStateRaw = localStorage.getItem("transactionState");
      const currentState = currentStateRaw 
        ? JSON.parse(currentStateRaw) 
        : { transactions: [], categories: [] };
      
      // Add new category to current state
      const updatedCategories = [...(currentState.categories || []), newCategory];
      const updatedState = { 
        ...currentState,
        categories: updatedCategories
      };
      
      console.log("Force saving after add category. Updated state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error in redundant save for add category:", error);
    }
    
    toast.success("Category added successfully");
    return true;
  };

  // Delete a category with error handling
  const deleteCategory = (id: string) => {
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    
    // Force immediate save to localStorage as redundancy
    try {
      const currentStateRaw = localStorage.getItem("transactionState");
      const currentState = currentStateRaw 
        ? JSON.parse(currentStateRaw) 
        : { transactions: [], categories: [] };
      
      // Remove category from current state
      const updatedCategories = currentState.categories.filter((c: Category) => c.id !== id);
      const updatedState = { 
        ...currentState,
        categories: updatedCategories 
      };
      
      console.log("Force saving after delete category. Updated state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error in redundant save for delete category:", error);
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
