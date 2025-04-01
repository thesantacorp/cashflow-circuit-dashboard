
import React, { useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";

import { TransactionContext } from "./context";
import { transactionReducer, initialState } from "./reducer";
import { TransactionState, TransactionAction } from "./types";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    dispatch({
      type: "ADD_TRANSACTION",
      payload: { ...transaction, id: uuidv4() },
    });
    toast.success("Transaction added successfully");
  };

  // Update a transaction
  const updateTransaction = (transaction: Transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    toast.success("Transaction updated successfully");
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id 
    });
    toast.success("Transaction deleted successfully");
  };

  // Add a category
  const addCategory = (category: Omit<Category, "id">) => {
    dispatch({
      type: "ADD_CATEGORY",
      payload: { ...category, id: uuidv4() },
    });
    toast.success("Category added successfully");
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id 
    });
  };
  
  // Import transactions
  const importData = (transactions: Transaction[]) => {
    dispatch({
      type: "IMPORT_TRANSACTIONS",
      payload: transactions
    });
    toast.success(`${transactions.length} transactions imported successfully`);
  };

  // Get transactions by type
  const getTransactionsByType = (type: TransactionType) => {
    return state.transactions.filter((transaction) => transaction.type === type);
  };

  // Get categories by type
  const getCategoriesByType = (type: TransactionType) => {
    return state.categories.filter((category) => category.type === type);
  };

  // Get category by id
  const getCategoryById = (id: string) => {
    return state.categories.find((category) => category.id === id);
  };

  // Get total amount by type
  const getTotalByType = (type: TransactionType) => {
    return state.transactions
      .filter((transaction) => transaction.type === type)
      .reduce((acc, transaction) => acc + transaction.amount, 0);
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
        getTransactionsByType,
        getCategoriesByType,
        getCategoryById,
        getTotalByType,
        importData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
