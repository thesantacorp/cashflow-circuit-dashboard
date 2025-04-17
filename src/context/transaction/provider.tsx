import React, { useReducer, useEffect, useState } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { transactionReducer, initialState } from "./reducer";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage
  const savedState = localStorage.getItem("transactionState");
  const loadedInitialState = savedState ? JSON.parse(savedState) : initialState;
  
  // Use try/catch to safely access auth context
  let authUser = null;
  try {
    const { user } = useAuth();
    authUser = user;
  } catch (error) {
    console.warn("Auth context not available yet");
  }
  
  const user = authUser;
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
  
  const [state, dispatch] = useReducer(transactionReducer, loadedInitialState);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving state to localStorage:', state);
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  // Run deduplication on initial load
  useEffect(() => {
    if (isInitialLoad && state.transactions.length > 0) {
      // Check for duplicates
      const idSet = new Set();
      let duplicatesFound = false;
      
      for (const tx of state.transactions) {
        if (idSet.has(tx.id)) {
          duplicatesFound = true;
          break;
        }
        idSet.add(tx.id);
      }
      
      if (duplicatesFound) {
        console.log('[TransactionProvider] Duplicate transactions found on startup, deduplicating...');
        dispatch({ type: "DEDUPLICATE_DATA" });
        toast.success("Removed duplicate transactions");
      }
      
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, state.transactions]);

  // Use the data operations hook
  const { 
    importData, 
    replaceAllData, 
    getTransactionsByType, 
    getCategoriesByType, 
    getCategoryById, 
    getTotalByType,
    addCategory,
    updateCategory,
    deleteCategory
  } = useDataOperations(state, dispatch);

  // Setup real-time subscription for transactions - with improved error handling
  useEffect(() => {
    if (!user) return;

    try {
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
        .subscribe((status) => {
          console.log('Transaction channel status:', status);
        });

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
        .subscribe((status) => {
          console.log('Category channel status:', status);
        });

      // Fetch initial data with force flag to ensure update
      if (user && isOnline) {
        fetchLatestData(true).then(() => {
          setIsInitialLoad(false);
          // Deduplicate data after initial load
          deduplicate();
        });
      }
      
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(categoryChannel);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  }, [user, isOnline]);

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
  const fetchLatestData = async (force = false) => {
    if (!user || !isOnline) return false;
    
    try {
      console.log('Fetching latest data from Supabase...');
      
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
      
      console.log(`Fetched ${transformedData.transactions.length} transactions and ${transformedData.categories.length} categories`);
      
      // Only replace all data if we have remote data or if force flag is set
      if (transformedData.transactions.length > 0 || transformedData.categories.length > 0 || force) {
        replaceAllData(transformedData);
        setLastSyncTime(new Date());
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      return false;
    }
  };

  // Deduplicate data function
  const deduplicate = () => {
    console.log('[TransactionProvider] Deduplicating data...');
    dispatch({ type: "DEDUPLICATE_DATA" });
    toast.success("Removed duplicate transactions");
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
    
    if (!transaction) {
      toast.error("Transaction not found");
      return false;
    }
    
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
    console.log('Adding new category:', newCategory);
    
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

  const updateCategory = (category) => {
    // Check for duplicates before updating
    const duplicateCategory = state.categories.find(
      c => c.id !== category.id && 
           c.name.toLowerCase() === category.name.toLowerCase() && 
           c.type === category.type
    );
    
    if (duplicateCategory) {
      toast.error(`A category named "${category.name}" already exists for ${category.type}`);
      return false;
    }
    
    dispatch({ 
      type: "UPDATE_CATEGORY", 
      payload: category 
    });
    
    // Immediately sync to Supabase
    if (user && isOnline) {
      syncCategoryToSupabase(category);
    }
    
    toast.success("Category updated successfully");
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
        updateCategory,
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
