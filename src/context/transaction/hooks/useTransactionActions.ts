
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Transaction, Category } from '@/types';
import { 
  insertTransaction, 
  updateTransaction as updateTransactionInDb, 
  deleteTransaction as deleteTransactionFromDb,
  insertCategory,
  deleteCategory as deleteCategoryFromDb
} from '@/utils/supabase/tableManagement';

/**
 * Hook to provide transaction CRUD operations
 */
export const useTransactionActions = (user: any, isOnline: boolean, setPendingSyncCount: (fn: (prev: number) => number) => void) => {
  /**
   * Add a new transaction to Supabase
   */
  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id">): Promise<boolean> => {
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
      
      if (user) {
        const dataForSupabase = {
          ...newTransaction,
          user_email: user.email
        };
        
        const result = await insertTransaction(dataForSupabase);
        
        if (!result.success) {
          toast.error("Failed to save transaction to cloud");
          setPendingSyncCount(prev => prev + 1);
          return false;
        } else {
          toast.success("Transaction added and saved to cloud");
          return true;
        }
      } else {
        toast.error("You must be logged in to save transactions");
        return false;
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
      return false;
    }
  }, [user, isOnline, setPendingSyncCount]);

  /**
   * Update an existing transaction in Supabase
   */
  const updateTransaction = useCallback(async (transaction: Transaction): Promise<boolean> => {
    if (!user && !isOnline) {
      toast.error("You must be online to update transactions");
      return false;
    }

    try {
      const updatedTransaction = {
        ...transaction,
        updatedAt: new Date().toISOString()
      };
      
      if (user) {
        const result = await updateTransactionInDb(updatedTransaction, user.email);
        
        if (!result.success) {
          toast.error("Failed to update transaction in cloud");
          setPendingSyncCount(prev => prev + 1);
          return false;
        } else {
          toast.success("Transaction updated and saved to cloud");
          return true;
        }
      } else {
        toast.error("You must be logged in to update transactions");
        return false;
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
      return false;
    }
  }, [user, isOnline, setPendingSyncCount]);

  /**
   * Delete a transaction from Supabase
   */
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!user && !isOnline) {
      toast.error("You must be online to delete transactions");
      return false;
    }

    try {
      if (user) {
        const result = await deleteTransactionFromDb(id, user.email);
        
        if (!result.success) {
          toast.error("Failed to delete transaction from cloud");
          setPendingSyncCount(prev => prev + 1);
          return false;
        } else {
          toast.success("Transaction deleted from cloud");
          return true;
        }
      } else {
        toast.error("You must be logged in to delete transactions");
        return false;
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
      return false;
    }
  }, [user, isOnline, setPendingSyncCount]);

  /**
   * Add a new category to Supabase
   */
  const addCategory = useCallback(async (category: Omit<Category, "id">): Promise<boolean> => {
    if (!user && !isOnline) {
      toast.error("You must be online to add categories");
      return false;
    }

    try {
      const newCategory = { ...category, id: uuidv4() };
      
      if (user) {
        const result = await insertCategory(newCategory, user.email);
        
        if (!result.success) {
          toast.error("Failed to save category to cloud");
          setPendingSyncCount(prev => prev + 1);
          return false;
        } else {
          toast.success("Category added and saved to cloud");
          return true;
        }
      } else {
        toast.error("You must be logged in to save categories");
        return false;
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
      return false;
    }
  }, [user, isOnline, setPendingSyncCount]);

  /**
   * Delete a category from Supabase
   */
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    if (!user && !isOnline) {
      toast.error("You must be online to delete categories");
      return false;
    }

    try {
      if (user) {
        const result = await deleteCategoryFromDb(id, user.email);
        
        if (!result.success) {
          toast.error("Failed to delete category from cloud");
          setPendingSyncCount(prev => prev + 1);
          return false;
        } else {
          toast.success("Category deleted from cloud");
          return true;
        }
      } else {
        toast.error("You must be logged in to delete categories");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
      return false;
    }
  }, [user, isOnline, setPendingSyncCount]);

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  };
};
