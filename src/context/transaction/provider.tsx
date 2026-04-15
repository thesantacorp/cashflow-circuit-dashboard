import React, { useReducer, useEffect, useState } from "react";
import { TransactionContext } from "./context";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { transactionReducer, initialState } from "./reducer";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Category } from "@/types";

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let authUser = null;
  let authLoading = true;
  try {
    const { user, isLoading } = useAuth();
    authUser = user;
    authLoading = isLoading;
  } catch (error) {
    console.warn("Auth context not available yet");
  }
  
  const user = authUser;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isOnline = useNetworkStatus();
  const offlineStorage = useOfflineStorage();
  const offlineQueue = useOfflineQueue();
  
  // Initialize with empty state — Supabase is the source of truth when logged in
  const [state, dispatch] = useReducer(transactionReducer, {
    transactions: offlineStorage.data.transactions,
    categories: offlineStorage.data.categories,
    nextTransactionId: 1,
    nextCategoryId: 100
  });

  // Sync state changes to offline storage
  useEffect(() => {
    offlineStorage.updateData({
      transactions: state.transactions,
      categories: state.categories
    });
  }, [state.transactions, state.categories]); // Removed offlineStorage from dependencies

  // Process offline queue when coming online
  useEffect(() => {
    if (!user || authLoading || !isOnline || offlineQueue.queueLength === 0) return;

    console.log(`Processing ${offlineQueue.queueLength} queued items`);
    void offlineQueue.processQueue(async (item) => {
      try {
        if (item.type === 'transaction') {
          return item.action === 'delete'
            ? await deleteTransactionFromSupabase(item.data)
            : await syncTransactionToSupabase(item.data);
        }

        if (item.type === 'category') {
          return item.action === 'delete'
            ? await deleteCategoryFromSupabase(item.data)
            : await syncCategoryToSupabase(item.data);
        }

        return false;
      } catch (error) {
        console.error('Queue processing error:', error);
        return false;
      }
    }).then(() => {
      void fetchLatestData(true);
    });
  }, [user, authLoading, isOnline, offlineQueue.queueLength]);

  // Only run the deduplication once on initial load, without showing toast
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
        // No toast for duplicate removal on startup
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
    if (authLoading) return;

    if (!user) {
      setIsInitialLoad(false);
      return;
    }

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

      if (isOnline) {
        fetchLatestData(true).then((success) => {
          setIsInitialLoad(false);
          if (success) {
            console.log('Initial sync completed successfully');
          } else {
            console.log('Initial sync failed, using offline data');
          }
        });
      } else {
        setIsInitialLoad(false);
        console.log('User logged in - working offline with local data');
      }
      
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(categoryChannel);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setIsInitialLoad(false);
    }
  }, [user, authLoading, isOnline]);

  // Remove the old syncPendingChanges function as it's replaced by the offline queue system

  const fetchLatestData = async (force = false) => {
    if (!user || !isOnline) return false;
    
    try {
      console.log('[fetchLatestData] Loading data from Supabase (source of truth)...');
      
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
      
      const cloudTransactions = transactionsData.map((t) => ({
        id: t.transaction_id,
        type: t.type,
        categoryId: t.category_id,
        amount: t.amount,
        description: t.description || '',
        date: t.date,
        emotionalState: t.emotional_state
      }));
      
      const cloudCategories = categoriesData.map((c) => ({
        id: c.category_id,
        name: c.name,
        type: c.type,
        color: c.color
      }));
      
      console.log(`[fetchLatestData] Supabase has ${cloudTransactions.length} transactions, ${cloudCategories.length} categories`);
      
      // Supabase is the source of truth — always use cloud data
      // Only exception: if cloud is empty, push any local-only data UP to cloud first
      const hasLocalData = state.transactions.length > 0 || state.categories.length > 0;
      const hasCloudData = cloudTransactions.length > 0 || cloudCategories.length > 0;
      
      if (!hasCloudData && hasLocalData) {
        console.log('[fetchLatestData] Cloud empty, local has data — pushing local data to cloud');
        // Sync local data up to cloud instead of losing it
        for (const t of state.transactions) {
          await syncTransactionToSupabase(t);
        }
        for (const c of state.categories) {
          await syncCategoryToSupabase(c);
        }
        console.log('[fetchLatestData] Local data pushed to cloud successfully');
        return true;
      }
      
      // Cloud data wins — replace local state entirely
      replaceAllData({
        transactions: cloudTransactions,
        categories: cloudCategories
      });
      setLastSyncTime(new Date());
      console.log(`[fetchLatestData] State replaced with Supabase data`);
      
      return true;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      return false;
    }
  };

  const deduplicate = (showToast = false) => {
    console.log('[TransactionProvider] Deduplicating data...');
    dispatch({ type: "DEDUPLICATE_DATA" });
    // Only show toast when explicitly requested (not during silent background operations)
    if (showToast) {
      toast("Removed duplicate items");
    }
    return true;
  };

  const reassignTransactions = (fromCategoryId: string, toCategoryId: string) => {
    // Validate the categories
    const fromCategory = state.categories.find(c => c.id === fromCategoryId);
    const toCategory = state.categories.find(c => c.id === toCategoryId);
    
    if (!fromCategory || !toCategory) {
      toast.error("One or both categories not found");
      return false;
    }
    
    if (fromCategory.type !== toCategory.type) {
      toast.error("Cannot move transactions between different types of categories");
      return false;
    }
    
    // Count affected transactions
    const affectedCount = state.transactions.filter(t => t.categoryId === fromCategoryId).length;
    
    if (affectedCount === 0) {
      toast.info("No transactions to reassign");
      return true;
    }
    
    // Dispatch the reassign action
    dispatch({
      type: "REASSIGN_TRANSACTIONS",
      payload: { fromCategoryId, toCategoryId }
    });
    
    // Sync changes if online
    if (user && isOnline) {
      // Update all affected transactions in Supabase
      const affectedTransactions = state.transactions.filter(t => t.categoryId === toCategoryId && 
                                                            t.originalCategoryId === fromCategoryId);
      
      for (const transaction of affectedTransactions) {
        syncTransactionToSupabase(transaction);
      }
    }
    
    toast.success(`Moved ${affectedCount} transactions from "${fromCategory.name}" to "${toCategory.name}"`);
    return true;
  };

  const addTransaction = (transaction) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    dispatch({
      type: "ADD_TRANSACTION",
      payload: newTransaction,
    });
    
    if (user) {
      if (isOnline) {
        void syncTransactionToSupabase(newTransaction).then((success) => {
          if (!success) {
            offlineQueue.addToQueue({
              id: newTransaction.id,
              type: 'transaction',
              action: 'create',
              data: newTransaction
            });
          }
        });
      } else {
        offlineQueue.addToQueue({
          id: newTransaction.id,
          type: 'transaction',
          action: 'create',
          data: newTransaction
        });
        toast("Transaction saved offline - will sync when online");
        return true;
      }
    }
    
    toast("Transaction added successfully");
    return true;
  };

  const updateTransaction = (transaction) => {
    dispatch({ 
      type: "UPDATE_TRANSACTION", 
      payload: transaction 
    });
    
    if (user) {
      if (isOnline) {
        void syncTransactionToSupabase(transaction).then((success) => {
          if (!success) {
            offlineQueue.addToQueue({
              id: transaction.id,
              type: 'transaction',
              action: 'update',
              data: transaction
            });
          }
        });
      } else {
        offlineQueue.addToQueue({
          id: transaction.id,
          type: 'transaction',
          action: 'update',
          data: transaction
        });
        toast("Transaction updated offline - will sync when online");
        return true;
      }
    }
    
    toast("Transaction updated successfully");
    return true;
  };

  const deleteTransaction = (id) => {
    const transaction = state.transactions.find(t => t.id === id);
    
    if (!transaction) {
      toast("Transaction not found");
      return false;
    }
    
    dispatch({ 
      type: "DELETE_TRANSACTION", 
      payload: id
    });
    
    if (user) {
      if (isOnline) {
        void deleteTransactionFromSupabase(transaction).then((success) => {
          if (!success) {
            offlineQueue.addToQueue({
              id: transaction.id,
              type: 'transaction',
              action: 'delete',
              data: transaction
            });
          }
        });
      } else {
        offlineQueue.addToQueue({
          id: transaction.id,
          type: 'transaction',
          action: 'delete',
          data: transaction
        });
        toast("Transaction deleted offline - will sync when online");
        return true;
      }
    }
    
    toast("Transaction deleted successfully");
    return true;
  };

  const addCategory = (category) => {
    const existingCategory = state.categories.find(
      c => c.name.toLowerCase() === category.name.toLowerCase() && 
           c.type === category.type
    );
    
    if (existingCategory) {
      toast(`Category "${category.name}" already exists`);
      return false;
    }
    
    const newCategory = { ...category, id: crypto.randomUUID() };
    console.log('Adding new category:', newCategory);
    
    dispatch({
      type: "ADD_CATEGORY",
      payload: newCategory,
    });
    
    if (user) {
      if (isOnline) {
        void syncCategoryToSupabase(newCategory).then((success) => {
          if (!success) {
            offlineQueue.addToQueue({
              id: newCategory.id,
              type: 'category',
              action: 'create',
              data: newCategory
            });
          }
        });
      } else {
        offlineQueue.addToQueue({
          id: newCategory.id,
          type: 'category',
          action: 'create',
          data: newCategory
        });
        toast("Category saved offline - will sync when online");
        return true;
      }
    }
    
    toast("Category added successfully");
    return true;
  };

  const updateCategory = (category) => {
    console.log('Provider - Update category initiated with data:', category);

    // Defensive: don't allow duplicate within same type except for current id.
    const duplicateCategory = state.categories.find(
      c => c.id !== category.id &&
        c.type === category.type &&
        c.name.trim().toLowerCase() === category.name.trim().toLowerCase()
    );

    if (duplicateCategory) {
      console.error(`[TransactionProvider] Cannot update: Duplicate name "${category.name}" for type ${category.type}. Existing:`, duplicateCategory);
      toast.error(`A category named "${category.name}" already exists for ${category.type}`);
      return false;
    }

    // Ensure actual category exists
    const existingCategory = state.categories.find(c => c.id === category.id);
    if (!existingCategory) {
      console.error(`[TransactionProvider] Cannot update: No category with ID ${category.id}`);
      toast.error("Cannot update: Category not found");
      return false;
    }

    // Updating name/color ONLY - never link to another category except via explicit move (handled in modal)
    dispatch({ type: "UPDATE_CATEGORY", payload: category });

    // Sync with supabase if needed:
    if (user) {
      if (isOnline) {
        syncCategoryToSupabase(category)
          .then(success => {
            if (success) {
              cleanupDuplicateCategories(category);
            } else {
              offlineQueue.addToQueue({
                id: category.id,
                type: 'category',
                action: 'update',
                data: category
              });
            }
          })
          .catch(err => {
            offlineQueue.addToQueue({
              id: category.id,
              type: 'category',
              action: 'update',
              data: category
            });
          });
      } else {
        offlineQueue.addToQueue({
          id: category.id,
          type: 'category',
          action: 'update',
          data: category
        });
      }
    }

    toast.success("Category updated successfully");
    return true;
  };

  const deleteCategory = (id) => {
    const hasTransactions = state.transactions.some(
      (transaction) => transaction.categoryId === id
    );
    
    if (hasTransactions) {
      toast("Cannot delete a category that has transactions");
      return false;
    }
    
    const category = state.categories.find(c => c.id === id);
    
    dispatch({ 
      type: "DELETE_CATEGORY", 
      payload: id
    });
    
    if (user && category) {
      if (isOnline) {
        void deleteCategoryFromSupabase(category).then((success) => {
          if (!success) {
            offlineQueue.addToQueue({
              id: category.id,
              type: 'category',
              action: 'delete',
              data: category
            });
          }
        });
      } else {
        offlineQueue.addToQueue({
          id: category.id,
          type: 'category',
          action: 'delete',
          data: category
        });
        toast("Category deleted offline - will sync when online");
        return true;
      }
    }
    
    toast("Category deleted successfully");
    return true;
  };

  const syncTransactionToSupabase = async (transaction) => {
    if (!user || !isOnline) return false;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .upsert({
          user_email: user.email,
          transaction_id: transaction.id,
          type: transaction.type,
          category_id: transaction.categoryId,
          amount: transaction.amount,
          description: transaction.description || '',
          date: transaction.date,
          emotional_state: transaction.emotionalState || 'neutral'
        }, { onConflict: 'user_email,transaction_id' });
      
      if (error) {
        console.warn('Upsert failed, falling back to insert:', error.message);
        await supabase
          .from('transactions')
          .delete()
          .eq('user_email', user.email)
          .eq('transaction_id', transaction.id);
        
        const { error: insertError } = await supabase
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
        
        if (insertError) throw insertError;
      }
      
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      offlineQueue.removeFromQueue(transaction.id, 'transaction');
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
      
      offlineQueue.removeFromQueue(transaction.id, 'transaction');
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
      console.log('Provider - Syncing category to Supabase:', category);
      
      // Use upsert to avoid delete-then-insert data loss
      const { error: insertError } = await supabase
        .from('categories')
        .upsert({
          user_email: user.email,
          category_id: category.id,
          name: category.name,
          type: category.type,
          color: category.color
        }, { onConflict: 'user_email,category_id' });
      
      if (insertError) {
        // Fallback if no unique constraint exists
        console.warn('Category upsert failed, falling back to delete+insert:', insertError.message);
        await supabase
          .from('categories')
          .delete()
          .eq('user_email', user.email)
          .eq('category_id', category.id);
        
        const { error: fallbackError } = await supabase
          .from('categories')
          .insert({
            user_email: user.email,
            category_id: category.id,
            name: category.name,
            type: category.type,
            color: category.color
          });
        
        if (fallbackError) throw fallbackError;
      }
      
      if (insertError) {
        console.error('Provider - Error inserting updated category:', insertError);
        throw insertError;
      }
      
      console.log('Provider - Category synced successfully to Supabase:', category.name);
      
      // Update profile backup date
      if (user.id) {
        await supabase
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      
      // Remove from offline queue if it was there
      offlineQueue.removeFromQueue(category.id, 'category');
      
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Provider - Sync category error:', error);
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
      
      offlineQueue.removeFromQueue(category.id, 'category');
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      return false;
    }
  };

  const cleanupDuplicateCategories = async (category) => {
    if (!user || !isOnline) return;
    
    try {
      console.log('Provider - Looking for duplicate categories to clean up for:', category.name);
      
      // Find any categories with the same name and type but different IDs
      const { data: duplicates, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_email', user.email)
        .eq('type', category.type)
        .ilike('name', category.name)
        .neq('category_id', category.id);
      
      if (error) {
        console.error('Provider - Error finding duplicate categories:', error);
        return;
      }
      
      if (duplicates && duplicates.length > 0) {
        console.log(`Provider - Found ${duplicates.length} duplicate categories to clean up:`, duplicates);
        
        // Delete all duplicates
        for (const dup of duplicates) {
          const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('user_email', user.email)
            .eq('category_id', dup.category_id);
            
          if (deleteError) {
            console.error(`Provider - Error deleting duplicate category ${dup.category_id}:`, deleteError);
          } else {
            console.log(`Provider - Successfully deleted duplicate category: ${dup.name} (${dup.category_id})`);
          }
        }
        
        // Also deduplicate the local state
        dispatch({ type: "DEDUPLICATE_DATA" });
      } else {
        console.log('Provider - No duplicate categories found');
      }
    } catch (err) {
      console.error('Provider - Error in cleanupDuplicateCategories:', err);
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
        pendingSyncCount: offlineQueue.queueLength,
        reassignTransactions
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
