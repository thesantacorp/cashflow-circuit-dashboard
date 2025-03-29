
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Category, Transaction, TransactionType } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Define default categories
const defaultExpenseCategories: Category[] = [
  { id: "1", name: "Food & Drinks", type: "expense", color: "#e74c3c" },
  { id: "2", name: "Housing", type: "expense", color: "#3498db" },
  { id: "3", name: "Transportation", type: "expense", color: "#2ecc71" },
  { id: "4", name: "Entertainment", type: "expense", color: "#9b59b6" },
  { id: "5", name: "Shopping", type: "expense", color: "#f39c12" },
  { id: "6", name: "Utilities", type: "expense", color: "#1abc9c" },
  { id: "7", name: "Healthcare", type: "expense", color: "#e67e22" },
];

const defaultIncomeCategories: Category[] = [
  { id: "10", name: "Salary", type: "income", color: "#27ae60" },
  { id: "11", name: "Freelance", type: "income", color: "#2980b9" },
  { id: "12", name: "Investments", type: "income", color: "#8e44ad" },
  { id: "13", name: "Gifts", type: "income", color: "#d35400" },
];

// Define initial state
interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  categories: [...defaultExpenseCategories, ...defaultIncomeCategories],
  loading: false,
  error: null,
};

// Define action types
type ActionType =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

// Create reducer
const transactionReducer = (state: TransactionState, action: ActionType): TransactionState => {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== action.payload),
      };
    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case "DELETE_CATEGORY":
      // Check if any transactions are using this category
      const hasTransactions = state.transactions.some(
        (transaction) => transaction.categoryId === action.payload
      );
      
      if (hasTransactions) {
        toast.error("Cannot delete a category that has transactions");
        return state;
      }
      
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.payload),
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Create context
interface TransactionContextProps {
  state: TransactionState;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
}

const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);

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

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
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
    dispatch({ type: "DELETE_CATEGORY", payload: id });
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
        addTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        getTransactionsByType,
        getCategoriesByType,
        getCategoryById,
        getTotalByType,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

// Create hook
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
