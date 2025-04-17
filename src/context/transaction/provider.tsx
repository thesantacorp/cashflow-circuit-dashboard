import React, { useReducer, useEffect, useState } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { transactionReducer, initialState } from "./reducer";

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = localStorage.getItem("transactionState");
  const loadedInitialState = savedState ? JSON.parse(savedState) : initialState;
  
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
  const [pendingSync, setPendingSync] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored - online');
      setIsOnline(true);
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

  useEffect(() => {
    console.log('Saving state to localStorage:', state);
    localStorage.setItem("transactionState", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (isInitialLoad && state.transactions.length > 0) {
      const idSet = new Set();
      let duplicatesFound = false;
      
      for (const tx of state.transactions) {
        if (idSet.has(tx.id)) {
          duplicatesFound = true;
          break;
        }
        idSet.add(tx.id);
      }
      
      const categoryMap = new Map();
      let categoryDuplicatesFound = false;
      
      for (const category of state.categories) {
        const key = `${category.type}-${category.name.toLowerCase()}`;
        if (categoryMap.has(key)) {
          categoryDuplicatesFound = true;
          break;
        }
        categoryMap.set(key, category);
      }
      
      if (duplicatesFound || categoryDuplicatesFound) {
        console.log('[TransactionProvider] Duplicates found on startup, deduplicating...');
        dispatch({ type: "DEDUPLICATE_DATA" });
        toast.success("Removed duplicate items");
      }
      
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, state.transactions, state.categories]);

  const { 
    importData, 
    replaceAllData, 
    getTransactionsByType, 
    getCategoriesByType, 
    getCategoryById, 
    getTotalByType,
  } = useDataOperations(state, dispatch);

  useEffect(() => {
    if (!user) return;

    try {
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

      if (user && isOnline) {
        fetchLatestData(true).then(() => {
          setIsInitialLoad(false);
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

  const syncPendingChanges = async () => {
    if (!user || pendingSync.size === 0 || !isOnline) return;
    
    console.log(`Syncing ${pendingSync.size} pending changes`);
    
    const transactionsToSync = state.transactions.filter(t => 
      pendingSync.has(t.id)
    );
    
    for (const transaction of transactionsToSync) {
      await syncTransactionToSupabase(transaction);
    }
    
    setPendingSync(new Set());
    
    toast.success(`Synced ${transactionsToSync.length} transaction(s) to cloud`);
  };

  const fetchLatestData = async (force = false) => {
    if (!user || !isOnline) return false;
    
    try {
      console.log('Fetching latest data from Supabase...');
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', user.email);
      
      if (transactionsError) throw transactionsError;
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_email', user.email);
      
      if (categoriesError) throw categoriesError;
      
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

  const deduplicate = () => {
    console.log('[TransactionProvider] Deduplicating data...');
    dispatch({ type: "DEDUPLICATE_DATA" });
    toast.success("Removed duplicate items");
    return true;
  };

  const addTransaction = (transaction) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    if (user && isOnline) {
      syncTransactionToSupabase(newTransaction);
    } else if (user) {
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
    
    if (user && isOnline) {
      syncTransactionToSupabase(transaction);
    } else if (user) {
      setPendingSync(prev => new Set(prev).add(transaction.id));
    }
    
    toast.success("Transaction updated successfully");
    return true;
  };

  const deleteTransaction = (id) => {
    const transaction = state.transactions.find(t => t.id === id);
    
    if (!transaction) {
      toast.error("Transaction not found");
      return false;
    }
    
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    
    if (user && transaction && isOnline) {
      deleteTransactionFromSupabase(transaction);
    }
    
    toast.success("Transaction deleted successfully");
    return true;
  };

  const addCategory = (category) => {
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
    
    if (user && isOnline) {
      syncCategoryToSupabase(newCategory);
    }
    
    toast.success("Category added successfully");
    return true;
  };

  const updateCategory = (category) => {
    const duplicateCategory = state.categories.find(
      c => c.id !== category.id && 
           c.name.toLowerCase() === category.name.toLowerCase() && 
           c.type === category.type
    );
    
    if (duplicateCategory) {
      toast.error(`A category named "${category.name}" already exists for ${category.type}`);
      return false;
    }
    
    console.log('Updating category in state:', category);
    dispatch({ 
      type: "UPDATE_CATEGORY", 
      payload: category 
    });
    
    if (user && isOnline) {
      syncCategoryToSupabase(category)
        .then(success => {
          if (!success) {
            console.warn('Failed to sync category update to Supabase');
          }
        })
        .catch(err => {
          console.error('Error during category sync:', err);
        });
    } else if (user) {
      console.log('Offline, adding category to pending sync:', category.id);
      setPendingSync(prev => new Set(prev).add(category.id));
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
    
    const category = state.categories.find(c => c.id === id);
    
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    
    if (user && category && isOnline) {
      deleteCategoryFromSupabase(category);
    }
    
    toast.success("Category deleted successfully");
    return true;
  };

  const syncTransactionToSupabase = async (transaction) => {
    if (!user || !isOnline) return false;
    
    try {
      await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email)
        .eq('transaction_id', transaction.id);
      
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
      await supabase
        .from('categories')
        .delete()
        .eq('user_email', user.email)
        .eq('category_id', category.id);
      
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
