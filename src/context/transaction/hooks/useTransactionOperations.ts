
import { useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";
import { transactionReducer, initialState } from "../reducer";

export function useTransactionOperations(userUuid: string | null) {
  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const [state, dispatch] = useReducer(
    transactionReducer,
    savedState ? JSON.parse(savedState) : initialState
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Add a transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "ADD_TRANSACTION",
      payload: { ...transaction, id: uuidv4() },
    });
    toast.success("Transaction added successfully");
    return true;
  };

  // Update a transaction
  const updateTransaction = (transaction: Transaction) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    toast.success("Transaction updated successfully");
    return true;
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id 
    });
    toast.success("Transaction deleted successfully");
    return true;
  };

  // Add a category
  const addCategory = (category: Omit<Category, "id">) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "ADD_CATEGORY",
      payload: { ...category, id: uuidv4() },
    });
    toast.success("Category added successfully");
    return true;
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
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
