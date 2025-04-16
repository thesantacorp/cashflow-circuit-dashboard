
import React, { useReducer, useEffect, useState, useCallback } from "react";
import { TransactionContext } from "./context";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Transaction, Category } from "@/types";
import { TransactionState } from "./types";
import { v4 as uuidv4 } from "uuid";
import { allDefaultCategories } from "./defaultCategories";
import { supabase } from "@/integrations/supabase/client";
import { 
  insertTransaction, 
  updateTransaction as updateTransactionInDb, 
  deleteTransaction as deleteTransactionFromDb,
  insertCategory,
  deleteCategory as deleteCategoryFromDb,
  fetchTransactions,
  fetchCategories
} from "@/utils/supabase/tableManagement";

const initialState: TransactionState = {
  transactions: [],
  categories: allDefaultCategories,
  nextTransactionId: 1,
  nextCategoryId: 100
};

const transactionReducer = (state: TransactionState, action: any): TransactionState => {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return { 
        ...state, 
        transactions: [...state.transactions, action.payload] 
      };
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
      return { 
        ...state, 
        categories: [...state.categories, action.payload] 
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
    case "REPLACE_ALL_DATA":
      if (!action.payload.categories || action.payload.categories.length === 0) {
        action.payload.categories = allDefaultCategories;
      }
      return action.payload;
    default:
      return state;
  }
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [syncNeeded, setSyncNeeded] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load data from Supabase on initialization or when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        // If no user, fall back to local storage
        try {
          const savedState = localStorage.getItem("transactionState");
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState) {
              dispatch({ 
                type: "REPLACE_ALL_DATA", 
                payload: {
                  ...parsedState,
                  categories: parsedState.categories && parsedState.categories.length > 0 
                    ? parsedState.categories 
                    : allDefaultCategories
                }
              });
            }
          }
        } catch (error) {
          console.error("Failed to load from localStorage", error);
          dispatch({ 
            type: "REPLACE_ALL_DATA", 
            payload: initialState
          });
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { transactions, error: transactionsError } = await fetchTransactions(user.email);
        
        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
          toast.error("Failed to load transactions from cloud");
          setIsLoading(false);
          return;
        }
        
        const { categories, error: categoriesError } = await fetchCategories(user.email);
        
        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          toast.error("Failed to load categories from cloud");
          setIsLoading(false);
          return;
        }

        const finalCategories = categories.length > 0 ? categories : allDefaultCategories;
        
        dispatch({
          type: "REPLACE_ALL_DATA",
          payload: {
            transactions,
            categories: finalCategories,
            nextTransactionId: state.nextTransactionId,
            nextCategoryId: state.nextCategoryId
          }
        });
        
        setLastSyncTime(new Date());
        toast.success("Data loaded from cloud");
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
        toast.error("Failed to load data from cloud");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user && pendingSyncCount > 0) {
        setSyncNeeded(true);
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, pendingSyncCount]);

  // Listen for real-time updates from Supabase
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-updates')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'transactions',
        filter: `user_email=eq.${user.email}`
      }, (payload) => {
        console.log('Database change received:', payload);
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Refresh data from Supabase
  const refreshData = async () => {
    if (!user || !isOnline) {
      return false;
    }

    try {
      const { transactions, error: transactionsError } = await fetchTransactions(user.email);
      
      if (transactionsError) {
        throw transactionsError;
      }
      
      const { categories, error: categoriesError } = await fetchCategories(user.email);
      
      if (categoriesError) {
        throw categoriesError;
      }
      
      const finalCategories = categories.length > 0 ? categories : allDefaultCategories;
      
      dispatch({
        type: "REPLACE_ALL_DATA",
        payload: {
          transactions,
          categories: finalCategories,
          nextTransactionId: state.nextTransactionId,
          nextCategoryId: state.nextCategoryId
        }
      });
      
      setLastSyncTime(new Date());
      toast.success("Data refreshed from cloud");
      return true;
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
      toast.error('Failed to refresh data from cloud');
      return false;
    }
  };

  // Deduplicate transactions
  const deduplicate = () => {
    const uniqueTransactions = Array.from(
      new Map(state.transactions.map(item => [item.id, item])).values()
    );
    
    if (uniqueTransactions.length !== state.transactions.length) {
      dispatch({
        type: "REPLACE_ALL_DATA",
        payload: {
          ...state,
          transactions: uniqueTransactions
        }
      });
      toast.success(`Removed ${state.transactions.length - uniqueTransactions.length} duplicate transactions`);
    }
    return true;
  };

  // Add transaction directly to Supabase
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!user && !isOnline) {
      toast.error("You must be online to add transactions");
      return false;
    }

    try {
      const newTransaction = { 
        ...transaction, 
        id: uuidv4(),
        updatedAt: new Date().toISOString()
      };
      
      // First update local state for immediate UI feedback
      dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });
      
      // Then save to Supabase
      if (user) {
        const result = await insertTransaction({
          ...newTransaction,
          user_email: user.email
        });
        
        if (!result.success) {
          toast.error("Failed to save transaction to cloud");
          setSyncNeeded(true);
          setPendingSyncCount((prevCount: number) => prevCount + 1);
        } else {
          toast.success("Transaction added and saved to cloud");
        }
      } else {
        // Fallback to local storage if no user
        try {
          const currentStateRaw = localStorage.getItem("transactionState");
          const currentState = currentStateRaw 
            ? JSON.parse(currentStateRaw) 
            : { transactions: [], categories: allDefaultCategories };
          
          const updatedState = { 
            ...currentState,
            transactions: [...currentState.transactions, newTransaction]
          };
          
          localStorage.setItem("transactionState", JSON.stringify(updatedState));
          toast.success("Transaction saved locally");
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
      return false;
    }
  };

  // Update transaction directly in Supabase
  const updateTransaction = async (transaction: Transaction) => {
    if (!user && !isOnline) {
      toast.error("You must be online to update transactions");
      return false;
    }

    try {
      const updatedTransaction = {
        ...transaction,
        updatedAt: new Date().toISOString()
      };
      
      // First update local state for immediate UI feedback
      dispatch({ type: "UPDATE_TRANSACTION", payload: updatedTransaction });
      
      // Then update in Supabase
      if (user) {
        const result = await updateTransactionInDb(updatedTransaction, user.email);
        
        if (!result.success) {
          toast.error("Failed to update transaction in cloud");
          setSyncNeeded(true);
          setPendingSyncCount((prevCount: number) => prevCount + 1);
        } else {
          toast.success("Transaction updated and saved to cloud");
        }
      } else {
        // Fallback to local storage if no user
        try {
          const currentStateRaw = localStorage.getItem("transactionState");
          const currentState = currentStateRaw 
            ? JSON.parse(currentStateRaw) 
            : { transactions: [], categories: allDefaultCategories };
          
          const updatedTransactions = currentState.transactions.map((t: Transaction) => 
            t.id === transaction.id ? updatedTransaction : t
          );
          
          const updatedState = { 
            ...currentState,
            transactions: updatedTransactions
          };
          
          localStorage.setItem("transactionState", JSON.stringify(updatedState));
          toast.success("Transaction updated locally");
        } catch (error) {
          console.error("Error updating in localStorage:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
      return false;
    }
  };

  // Delete transaction directly from Supabase
  const deleteTransaction = async (id: string) => {
    if (!user && !isOnline) {
      toast.error("You must be online to delete transactions");
      return false;
    }

    try {
      // First update local state for immediate UI feedback
      dispatch({ type: "DELETE_TRANSACTION", payload: id });
      
      // Then delete from Supabase
      if (user) {
        const result = await deleteTransactionFromDb(id, user.email);
        
        if (!result.success) {
          toast.error("Failed to delete transaction from cloud");
          setSyncNeeded(true);
        } else {
          toast.success("Transaction deleted from cloud");
        }
      } else {
        // Fallback to local storage if no user
        try {
          const currentStateRaw = localStorage.getItem("transactionState");
          const currentState = currentStateRaw 
            ? JSON.parse(currentStateRaw) 
            : { transactions: [], categories: allDefaultCategories };
          
          const updatedTransactions = currentState.transactions.filter((t: Transaction) => t.id !== id);
          
          const updatedState = { 
            ...currentState,
            transactions: updatedTransactions
          };
          
          localStorage.setItem("transactionState", JSON.stringify(updatedState));
          toast.success("Transaction deleted locally");
        } catch (error) {
          console.error("Error deleting from localStorage:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
      return false;
    }
  };

  // Add category directly to Supabase
  const addCategory = async (category: Omit<Category, "id">) => {
    if (!user && !isOnline) {
      toast.error("You must be online to add categories");
      return false;
    }

    try {
      const newCategory = { ...category, id: uuidv4() };
      
      // First update local state for immediate UI feedback
      dispatch({ type: "ADD_CATEGORY", payload: newCategory });
      
      // Then save to Supabase
      if (user) {
        const result = await insertCategory(newCategory, user.email);
        
        if (!result.success) {
          toast.error("Failed to save category to cloud");
          setSyncNeeded(true);
        } else {
          toast.success("Category added and saved to cloud");
        }
      } else {
        // Fallback to local storage if no user
        try {
          const currentStateRaw = localStorage.getItem("transactionState");
          const currentState = currentStateRaw 
            ? JSON.parse(currentStateRaw) 
            : { transactions: [], categories: allDefaultCategories };
          
          const updatedState = { 
            ...currentState,
            categories: [...currentState.categories, newCategory]
          };
          
          localStorage.setItem("transactionState", JSON.stringify(updatedState));
          toast.success("Category saved locally");
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
      return false;
    }
  };

  // Delete category directly from Supabase
  const deleteCategory = async (id: string) => {
    if (!user && !isOnline) {
      toast.error("You must be online to delete categories");
      return false;
    }

    // Check if category is in use
    const hasTransactions = state.transactions.some(
      (transaction) => transaction.categoryId === id
    );
    
    if (hasTransactions) {
      toast.error("Cannot delete a category that has transactions");
      return false;
    }

    try {
      // First update local state for immediate UI feedback
      dispatch({ type: "DELETE_CATEGORY", payload: id });
      
      // Then delete from Supabase
      if (user) {
        const result = await deleteCategoryFromDb(id, user.email);
        
        if (!result.success) {
          toast.error("Failed to delete category from cloud");
          setSyncNeeded(true);
        } else {
          toast.success("Category deleted from cloud");
        }
      } else {
        // Fallback to local storage if no user
        try {
          const currentStateRaw = localStorage.getItem("transactionState");
          const currentState = currentStateRaw 
            ? JSON.parse(currentStateRaw) 
            : { transactions: [], categories: allDefaultCategories };
          
          const updatedCategories = currentState.categories.filter((c: Category) => c.id !== id);
          
          const updatedState = { 
            ...currentState,
            categories: updatedCategories 
          };
          
          localStorage.setItem("transactionState", JSON.stringify(updatedState));
          toast.success("Category deleted locally");
        } catch (error) {
          console.error("Error deleting from localStorage:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
      return false;
    }
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
        getTransactionsByType: (type) => state.transactions.filter(t => t.type === type),
        getCategoriesByType: (type) => state.categories.filter(c => c.type === type),
        getCategoryById: (id) => state.categories.find(c => c.id === id),
        getTotalByType: (type) => state.transactions
          .filter(t => t.type === type)
          .reduce((acc, t) => acc + t.amount, 0),
        importData: (data) => dispatch({ type: "REPLACE_ALL_DATA", payload: data }),
        replaceAllData: (data) => dispatch({ type: "REPLACE_ALL_DATA", payload: data }),
        lastSyncTime,
        refreshData,
        deduplicate,
        isOnline,
        pendingSyncCount,
        isLoading
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
