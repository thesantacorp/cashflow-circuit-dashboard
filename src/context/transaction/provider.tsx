
import React, { useReducer, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";

import { TransactionContext } from "./context";
import { transactionReducer, initialState } from "./reducer";
import { TransactionState, TransactionAction } from "./types";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UUID state and email
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const [state, dispatch] = useReducer(
    transactionReducer,
    savedState ? JSON.parse(savedState) : initialState
  );

  // Check for saved UUID and email in localStorage
  useEffect(() => {
    const savedUuid = localStorage.getItem("userUuid");
    const savedEmail = localStorage.getItem("userEmail");
    if (savedUuid) {
      setUserUuid(savedUuid);
    }
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Generate a new UUID for the user and bind it to an email
  const generateUserUuid = (email?: string) => {
    const newUuid = uuidv4();
    localStorage.setItem("userUuid", newUuid);
    setUserUuid(newUuid);
    
    if (email) {
      localStorage.setItem("userEmail", email);
      setUserEmail(email);
      toast.success(`User ID generated and linked to ${email}`);
    } else {
      toast.success("User ID generated successfully");
    }
    
    return newUuid;
  };

  // Check if UUID exists
  const checkUuidExists = () => {
    return !!userUuid;
  };

  // Get user email
  const getUserEmail = () => {
    return userEmail;
  };

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
  
  // Import transactions
  const importData = (transactions: Transaction[]) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "IMPORT_TRANSACTIONS",
      payload: transactions
    });
    toast.success(`${transactions.length} transactions imported successfully`);
    return true;
  };

  // Replace all transactions
  const replaceAllData = (transactions: Transaction[]) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "REPLACE_ALL_DATA",
      payload: transactions
    });
    toast.success(`All data replaced with ${transactions.length} imported transactions`);
    return true;
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
        userUuid,
        userEmail,
        generateUserUuid,
        checkUuidExists,
        getUserEmail,
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
        replaceAllData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
