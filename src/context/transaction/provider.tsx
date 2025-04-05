import React, { useReducer, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Category, Transaction, TransactionType } from "@/types";
import { fetchUserUuid, storeUserUuid } from "@/utils/supabase";

import { TransactionContext } from "./context";
import { transactionReducer, initialState } from "./reducer";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UUID state and email
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const [state, dispatch] = useReducer(
    transactionReducer,
    savedState ? JSON.parse(savedState) : initialState
  );

  // Check for saved UUID and email
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      // First check localStorage to maintain backward compatibility
      const savedEmail = localStorage.getItem("userEmail");
      if (savedEmail) {
        setUserEmail(savedEmail);
        
        // Try to fetch from Supabase first
        const supabaseUuid = await fetchUserUuid(savedEmail);
        
        if (supabaseUuid) {
          setUserUuid(supabaseUuid);
          // Update localStorage with the Supabase UUID
          localStorage.setItem("userUuid", supabaseUuid);
        } else {
          // Fall back to localStorage UUID if no Supabase UUID
          const localUuid = localStorage.getItem("userUuid");
          if (localUuid) {
            setUserUuid(localUuid);
            // Migrate localStorage UUID to Supabase
            await storeUserUuid(savedEmail, localUuid);
          }
        }
      } else {
        // No saved email, check if we have a UUID in localStorage
        const localUuid = localStorage.getItem("userUuid");
        if (localUuid) {
          setUserUuid(localUuid);
        }
      }
      
      setIsLoading(false);
    };
    
    checkSavedUuid();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Generate a new UUID for the user and bind it to an email
  const generateUserUuid = async (email?: string): Promise<string> => {
    if (!email) {
      toast.error("Email is required to generate a User ID");
      return "";
    }
    
    const newUuid = uuidv4();
    
    // Store in Supabase
    const success = await storeUserUuid(email, newUuid);
    
    if (!success) {
      toast.error("Failed to store User ID. Please try again.");
      return "";
    }
    
    // Keep local copy for fast access
    localStorage.setItem("userUuid", newUuid);
    localStorage.setItem("userEmail", email);
    
    setUserUuid(newUuid);
    setUserEmail(email);
    
    toast.success(`User ID generated and linked to ${email}`);
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
