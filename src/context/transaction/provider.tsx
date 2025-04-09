
import React, { useReducer, useEffect, useState } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const initialState = savedState ? JSON.parse(savedState) : { transactions: [], categories: [] };
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
          break;
        case "UPDATE_TRANSACTION":
          newState = {
            ...state,
            transactions: state.transactions.map(t => 
              t.id === action.payload.id ? action.payload : t
            )
          };
          break;
        case "DELETE_TRANSACTION":
          newState = {
            ...state,
            transactions: state.transactions.filter(t => t.id !== action.payload)
          };
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
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', user.email);
      
      if (transactionsError) throw transactionsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_email', user.email);
      
      if (categoriesError) throw categoriesError;
      
      // Transform data to match application state format
      const transformedData = {
        transactions: transactionsData.map((t) => ({
          id: t.transaction_id,
          type: t.type,
          categoryId: t.category_id,
          amount: t.amount,
          description: t.description,
          date: t.date,
          emotionalState: t.emotional_state
        })),
        categories: categoriesData.map((c) => ({
          id: c.category_id,
          name: c.name,
          type: c.type,
          color: c.color
        }))
      };
      
      // Replace all data in the app
      replaceAllData(transformedData);
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
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
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
      // First, delete any existing transaction with this ID (to avoid duplicates)
      await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email)
        .eq('transaction_id', transaction.id);
      
      // Then insert the new/updated transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_email: user.email,
          transaction_id: transaction.id,
          type: transaction.type,
          category_id: transaction.categoryId,
          amount: transaction.amount,
          description: transaction.description || '',
          date: transaction.date,
          emotional_state: transaction.emotionalState || 'neutral'
        });
      
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
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email)
        .eq('transaction_id', transaction.id);
      
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
      // First, delete any existing category with this ID (to avoid duplicates)
      await supabase
        .from('categories')
        .delete()
        .eq('user_email', user.email)
        .eq('category_id', category.id);
      
      // Then insert the new/updated category
      const { error } = await supabase
        .from('categories')
        .insert({
          user_email: user.email,
          category_id: category.id,
          name: category.name,
          type: category.type,
          color: category.color
        });
      
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
      console.error('Sync category error:', error);
      return false;
    }
  };

  const deleteCategoryFromSupabase = async (category) => {
    if (!user || !isOnline) return false;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('user_email', user.email)
        .eq('category_id', category.id);
      
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
