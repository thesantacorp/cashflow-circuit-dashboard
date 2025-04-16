
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

export function useTransactionOperations() {
  // Get initial state from localStorage
  const getInitialState = () => {
    const savedState = localStorage.getItem("transactionState");
    return savedState ? JSON.parse(savedState) : initialState;
  };

  const [state, dispatch] = useReducer(
    transactionReducer,
    getInitialState()
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Add a transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    toast.success("Transaction added successfully");
    return true;
  };

  // Update a transaction
  const updateTransaction = (transaction: Transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    toast.success("Transaction updated successfully");
    return true;
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    toast.success("Transaction deleted successfully");
    return true;
  };

  // Add a category
  const addCategory = (category: Omit<Category, "id">) => {
    dispatch({
      type: "ADD_CATEGORY",
      payload: { ...category, id: uuidv4() },
    });
    toast.success("Category added successfully");
    return true;
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
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
