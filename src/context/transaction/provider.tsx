import React, { useReducer, useEffect, useState } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import * as tableManagement from "@/utils/supabase/tableManagement";
import { transactionReducer } from "./reducer";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage with safeguards
  const getInitialState = () => {
    try {
      const savedState = localStorage.getItem("transactionState");
      if (!savedState) {
        console.warn("No transactionState found in localStorage, creating empty state");
        return { transactions: [], categories: [] };
      }
      
      const parsedState = JSON.parse(savedState);
      console.log("Loaded initial state from localStorage:", parsedState);
      
      // Ensure proper structure
      if (!parsedState.transactions) parsedState.transactions = [];
      if (!parsedState.categories) parsedState.categories = [];
      
      return parsedState;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return { transactions: [], categories: [] };
    }
  };
  
  const initialState = getInitialState();
  const { user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Track operations that need to be synced
  const [pendingSync, setPendingSync] = useState<Set<string>>(new Set());
  
  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored - online');
      setIsOnline(true);
      // When coming back online, sync pending changes
      if (pendingSync.size > 0) {
        syncPendingChanges();
      }
    };
    
    const handleOffline = () => {
      console.log('Connection lost - offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync]);
  
  const [state, dispatch] = useReducer(
    (state, action) => {
      let newState;
      switch (action.type) {
        case "ADD_TRANSACTION":
          newState = { ...state, transactions: [...state.transactions, action.payload] };
          console.log("ADD_TRANSACTION - New state:", newState);
          // Immediately save to localStorage for redundancy
          try {
            localStorage.setItem("transactionState", JSON.stringify(newState));
          } catch (error) {
            console.error("Error saving ADD_TRANSACTION to localStorage:", error);
          }
          break;
        case "UPDATE_TRANSACTION":
          newState = {
            ...state,
            transactions: state.transactions.map(t => 
              t.id === action.payload.id ? action.payload : t
            )
          };
          console.log("UPDATE_TRANSACTION - New state:", newState);
          // Immediately save to localStorage for redundancy
          try {
            localStorage.setItem("transactionState", JSON.stringify(newState));
          } catch (error) {
            console.error("Error saving UPDATE_TRANSACTION to localStorage:", error);
          }
          break;
        case "DELETE_TRANSACTION":
          newState = {
            ...state,
            transactions: state.transactions.filter(t => t.id !== action.payload)
          };
          console.log("DELETE_TRANSACTION - New state:", newState);
          // Immediately save to localStorage for redundancy
          try {
            localStorage.setItem("transactionState", JSON.stringify(newState));
          } catch (error) {
            console.error("Error saving DELETE_TRANSACTION to localStorage:", error);
          }
          break;
        case "ADD_CATEGORY":
          // Check if a category with the same name and type already exists
          const existingCategory = state.categories.find(
            c => c.name.toLowerCase() === action.payload.name.toLowerCase() && 
                 c.type === action.payload.type
          );
          
          if (existingCategory) {
            toast.info(`Category "${action.payload.name}" already exists`);
            return state;
          }
          
          newState = { ...state, categories: [...state.categories, action.payload] };
          break;
        case "DELETE_CATEGORY":
          newState = {
            ...state,
            categories: state.categories.filter(c => c.id !== action.payload)
          };
          break;
        case "IMPORT_DATA":
          newState = { ...state, ...action.payload };
          break;
        case "REPLACE_ALL_DATA":
          newState = action.payload;
          break;
        case "DEDUPLICATE_DATA":
          // Deduplicate transactions by id
          const uniqueTransactions = Array.from(
            new Map(state.transactions.map(item => [item.id, item])).values()
          );
          
          // Deduplicate categories by name and type
          const uniqueCategories = Array.from(
            new Map(
              state.categories.map(item => [`${item.name}-${item.type}`, item])
            ).values()
          );
          
          newState = {
            ...state,
            transactions: uniqueTransactions,
            categories: uniqueCategories
          };
          break;
        default:
          return state;
      }
      
      // Update lastUpdate timestamp for sync detection
      localStorage.setItem("lastTransactionUpdate", new Date().toISOString());
      return newState;
    },
    initialState
  );

  // Save state to localStorage whenever it changes - with error handling
  useEffect(() => {
    try {
      console.log("Saving state to localStorage (size: " + 
        JSON.stringify(state).length + " bytes):", state);
      localStorage.setItem("transactionState", JSON.stringify(state));
      
      // Verify save was successful
      const savedState = localStorage.getItem("transactionState");
      if (savedState) {
        const parsedSaved = JSON.parse(savedState);
        if (parsedSaved.transactions?.length !== state.transactions?.length) {
          console.error("Verification failed: Transaction count mismatch in localStorage!", 
            {saved: parsedSaved.transactions?.length, current: state.transactions?.length});
          
          // Retry save
          console.log("Retrying localStorage save...");
          localStorage.setItem("transactionState", JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
      
      // Try saving with just the essential data if full state is too large
      try {
        const minimalState = {
          transactions: state.transactions,
          categories: state.categories
        };
        localStorage.setItem("transactionState", JSON.stringify(minimalState));
        console.log("Saved minimal state to localStorage as fallback");
      } catch (innerError) {
        console.error("Even minimal state save failed:", innerError);
      }
    }
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

  // Setup real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time transactions updates
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_email=eq.${user.email}`
        }, 
        async (payload) => {
          console.log('Transaction change detected:', payload);
          if (isOnline) {
            await fetchLatestData();
            setLastSyncTime(new Date());
          }
        }
      )
      .subscribe();

    // Subscribe to real-time category updates
    const categoryChannel = supabase
      .channel('public:categories')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories',
          filter: `user_email=eq.${user.email}`
        }, 
        async (payload) => {
          console.log('Category change detected:', payload);
          if (isOnline) {
            await fetchLatestData();
            setLastSyncTime(new Date());
          }
        }
      )
      .subscribe();

    // Fetch initial data
    if (isInitialLoad && user && isOnline) {
      fetchLatestData().then(() => {
        setIsInitialLoad(false);
        // Deduplicate data after initial load
        deduplicate();
      });
    }
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(categoryChannel);
    };
  }, [user, isInitialLoad, isOnline]);

  // Sync pending changes when coming back online
  const syncPendingChanges = async () => {
    if (!user || pendingSync.size === 0 || !isOnline) return;
    
    console.log(`Syncing ${pendingSync.size} pending changes`);
    
    // Get transactions that need to be synced
    const transactionsToSync = state.transactions.filter(t => 
      pendingSync.has(t.id)
    );
    
    // Sync each transaction
    for (const transaction of transactionsToSync) {
      await syncTransactionToSupabase(transaction);
    }
    
    // Clear pending sync after successful sync
    setPendingSync(new Set());
    
    toast.success(`Synced ${transactionsToSync.length} transaction(s) to cloud`);
  };

  // Function to fetch latest data from Supabase
  const fetchLatestData = async () => {
    if (!user || !isOnline) return false;
    
    try {
      // Fetch transactions
      const { transactions, error: transactionsError } = await tableManagement.fetchTransactions(user.email);
      
      if (transactionsError) throw transactionsError;
      
      // Fetch categories
      const { categories, error: categoriesError } = await tableManagement.fetchCategories(user.email);
      
      if (categoriesError) throw categoriesError;
      
      // Replace all data in the app
      replaceAllData({ transactions, categories });
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      return false;
    }
  };

  // Deduplicate data function
  const deduplicate = () => {
    dispatch({ type: "DEDUPLICATE_DATA" });
    
    // Also sync the deduplicated data to Supabase if user is logged in
    if (user && isOnline) {
      // First, deduplicate in the state
      setTimeout(() => {
        // Then sync all transactions and categories to Supabase
        state.transactions.forEach(transaction => {
          syncTransactionToSupabase(transaction);
        });
        
        state.categories.forEach(category => {
          syncCategoryToSupabase(category);
        });
        
        toast.success("Data synced to cloud");
      }, 500);
    }
    
    return true;
  };

  // Basic transaction operations
  const addTransaction = (transaction) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    console.log("Adding new transaction:", newTransaction);
    
    // First try to update the state with dispatch
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    // Manual redundant save to localStorage as a fallback
    try {
      const currentState = JSON.parse(localStorage.getItem("transactionState") || JSON.stringify({ transactions: [], categories: [] }));
      const updatedTransactions = [...currentState.transactions, newTransaction];
      const updatedState = { ...currentState, transactions: updatedTransactions };
      
      console.log("Redundant save after adding transaction. New state:", updatedState);
      localStorage.setItem("transactionState", JSON.stringify(updatedState));
      
      // Verify the save
      const verifyState = localStorage.getItem("transactionState");
      if (verifyState) {
        const parsedVerify = JSON.parse(verifyState);
        console.log(`Verify save: localStorage has ${parsedVerify.transactions?.length} transactions`);
      }
    } catch (error) {
      console.error("Error in redundant save:", error);
    }
    
    // Immediately sync to Supabase or mark for future sync
    if (user && isOnline) {
      syncTransactionToSupabase(newTransaction);
    } else if (user) {
      // Store the ID to sync later when online
      setPendingSync(prev => new Set(prev).add(newTransaction.id));
    }
    
    toast.success("Transaction added successfully");
    return true;
  };

  const updateTransaction = (transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    
    // Immediately sync to Supabase or mark for future sync
    if (user && isOnline) {
      syncTransactionToSupabase(transaction);
    } else if (user) {
      // Store the ID to sync later when online
      setPendingSync(prev => new Set(prev).add(transaction.id));
    }
    
    toast.success("Transaction updated successfully");
    return true;
  };

  const deleteTransaction = (id) => {
    // Find transaction before deleting it
    const transaction = state.transactions.find(t => t.id === id);
    
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    
    // Immediately delete from Supabase
    if (user && transaction && isOnline) {
      deleteTransactionFromSupabase(transaction);
    }
    
    toast.success("Transaction deleted successfully");
    return true;
  };

  const addCategory = (category) => {
    // Check for duplicates before adding
    const existingCategory = state.categories.find(
      c => c.name.toLowerCase() === category.name.toLowerCase() && 
           c.type === category.type
    );
    
    if (existingCategory) {
      toast.info(`Category "${category.name}" already exists`);
      return false;
    }
    
    const newCategory = { ...category, id: crypto.randomUUID() };
    dispatch({
      type: "ADD_CATEGORY",
      payload: newCategory,
    });
    
    // Immediately sync to Supabase
    if (user && isOnline) {
      syncCategoryToSupabase(newCategory);
    }
    
    toast.success("Category added successfully");
    return true;
  };

  const deleteCategory = (id) => {
    const hasTransactions = state.transactions.some(
      (transaction) => transaction.categoryId === id
    );
    
    if (hasTransactions) {
      toast.error("Cannot delete a category that has transactions");
      return false;
    }
    
    // Find category before deleting it
    const category = state.categories.find(c => c.id === id);
    
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    
    // Immediately delete from Supabase
    if (user && category && isOnline) {
      deleteCategoryFromSupabase(category);
    }
    
    toast.success("Category deleted successfully");
    return true;
  };

  // Functions to sync data to Supabase
  const syncTransactionToSupabase = async (transaction) => {
    if (!user || !isOnline) return false;
    
    try {
      // Update the transaction in Supabase
      const { error } = await tableManagement.updateTransaction(transaction, user.email);
      
      // If update fails (probably because it doesn't exist), try to insert it
      if (error) {
        console.log('Transaction update failed, trying insert:', error);
        // We need to add user_email for the insert to work with RLS
        const insertResult = await tableManagement.insertTransaction({
          ...transaction,
          user_email: user.email
        });
        
        if (insertResult.error) {
          throw insertResult.error;
        }
      }
      
      // Update profile with last sync date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      // Remove from pending sync if it was there
      if (pendingSync.has(transaction.id)) {
        setPendingSync(prev => {
          const updated = new Set(prev);
          updated.delete(transaction.id);
          return updated;
        });
      }
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Sync transaction error:', error);
      return false;
    }
  };

  const deleteTransactionFromSupabase = async (transaction) => {
    if (!user || !isOnline) return false;
    
    try {
      // Delete the transaction from Supabase
      const { error } = await tableManagement.deleteTransaction(transaction.id, user.email);
      
      if (error) throw error;
      
      // Update profile with last sync date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Delete transaction error:', error);
      return false;
    }
  };

  const syncCategoryToSupabase = async (category) => {
    if (!user || !isOnline) return false;
    
    try {
      // Update the category in Supabase
      const { error } = await tableManagement.updateCategory(category, user.email);
      
      // If update fails (probably because it doesn't exist), try to insert it
      if (error) {
        console.log('Category update failed, trying insert:', error);
        const insertResult = await tableManagement.insertCategory(category, user.email);
        
        if (insertResult.error) {
          throw insertResult.error;
        }
      }
      
      // Update profile with last sync date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Sync category error:', error);
      return false;
    }
  };

  const deleteCategoryFromSupabase = async (category) => {
    if (!user || !isOnline) return false;
    
    try {
      // Delete the category from Supabase
      const { error } = await tableManagement.deleteCategory(category.id, user.email);
      
      if (error) throw error;
      
      // Update profile with last sync date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Delete category error:', error);
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
        getTransactionsByType,
        getCategoriesByType,
        getCategoryById,
        getTotalByType,
        importData,
        replaceAllData,
        lastSyncTime,
        refreshData: fetchLatestData,
        deduplicate,
        isOnline,
        pendingSyncCount: pendingSync.size
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
