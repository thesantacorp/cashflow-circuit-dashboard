
import { supabase } from './client';
import { Category, Transaction } from '@/types';

interface FetchTransactionsResponse {
  transactions: Transaction[];
  error: Error | null;
}

interface FetchCategoriesResponse {
  categories: Category[];
  error: Error | null;
}

/**
 * Fetches transactions for a user from Supabase
 */
export const fetchTransactions = async (userEmail: string): Promise<FetchTransactionsResponse> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error fetching transactions:', error);
      return { transactions: [], error };
    }

    return { transactions: data as Transaction[], error: null };
  } catch (error) {
    console.error('Exception fetching transactions:', error);
    return { transactions: [], error: error as Error };
  }
};

/**
 * Fetches categories for a user from Supabase
 */
export const fetchCategories = async (userEmail: string): Promise<FetchCategoriesResponse> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error fetching categories:', error);
      return { categories: [], error };
    }

    return { categories: data as Category[], error: null };
  } catch (error) {
    console.error('Exception fetching categories:', error);
    return { categories: [], error: error as Error };
  }
};

/**
 * Inserts a transaction into Supabase
 */
export const insertTransaction = async (transaction: Transaction) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction]);

    if (error) {
      console.error('Error inserting transaction:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception inserting transaction:', error);
    return { success: false, error };
  }
};

/**
 * Updates a transaction in Supabase
 */
export const updateTransaction = async (transaction: Transaction) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('transaction_id', transaction.id); // Using id instead of transaction_id

    if (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception updating transaction:', error);
    return { success: false, error };
  }
};

/**
 * Deletes a transaction from Supabase
 */
export const deleteTransaction = async (transactionId: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', transactionId);

    if (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception deleting transaction:', error);
    return { success: false, error };
  }
};

/**
 * Inserts a category into Supabase
 */
export const insertCategory = async (category: Category) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category]);

    if (error) {
      console.error('Error inserting category:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception inserting category:', error);
    return { success: false, error };
  }
};

/**
 * Updates a category in Supabase
 */
export const updateCategory = async (category: Category) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('category_id', category.id); // Using id instead of category_id

    if (error) {
      console.error('Error updating category:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception updating category:', error);
    return { success: false, error };
  }
};

/**
 * Deletes a category from Supabase
 */
export const deleteCategory = async (categoryId: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return { success: false, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception deleting category:', error);
    return { success: false, error };
  }
};

// This is a stub for getAllUuids.ts compatibility
export const ensureUuidTableExists = async () => {
  console.warn("ensureUuidTableExists function is now a stub");
  return { success: true, error: null };
};
