
import React, { useReducer, useEffect } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const initialState = savedState ? JSON.parse(savedState) : { transactions: [], categories: [] };
  
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "ADD_TRANSACTION":
          return { ...state, transactions: [...state.transactions, action.payload] };
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
          return { ...state, categories: [...state.categories, action.payload] };
        case "DELETE_CATEGORY":
          return {
            ...state,
            categories: state.categories.filter(c => c.id !== action.payload)
          };
        case "IMPORT_DATA":
          return { ...state, ...action.payload };
        case "REPLACE_ALL_DATA":
          return action.payload;
        default:
          return state;
      }
    },
    initialState
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Use the data operations hook
  const { 
    importData, 
    replaceAllData, 
    getTransactionsByType, 
    getCategoriesByType, 
    getCategoryById, 
    getTotalByType 
  } = useDataOperations(state, dispatch);

  // Basic transaction operations
  const addTransaction = (transaction) => {
    dispatch({
      type: "ADD_TRANSACTION",
      payload: { ...transaction, id: crypto.randomUUID() },
    });
    toast.success("Transaction added successfully");
    return true;
  };

  const updateTransaction = (transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    toast.success("Transaction updated successfully");
    return true;
  };

  const deleteTransaction = (id) => {
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    toast.success("Transaction deleted successfully");
    return true;
  };

  const addCategory = (category) => {
    dispatch({
      type: "ADD_CATEGORY",
      payload: { ...category, id: crypto.randomUUID() },
    });
    toast.success("Category added successfully");
    return true;
  };

  const deleteCategory = (id) => {
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
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
