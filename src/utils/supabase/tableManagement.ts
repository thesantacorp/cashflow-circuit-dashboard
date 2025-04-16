import { supabase } from '@/integrations/supabase/client';
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

    // Transform the data to match our Transaction type
    const transformedTransactions: Transaction[] = data.map(item => ({
      id: item.transaction_id,
      amount: Number(item.amount),
      categoryId: item.category_id || '',
      date: item.date,
      description: item.description || '',
      type: item.type as 'expense' | 'income',
      emotionalState: item.emotional_state as any || 'neutral'
    }));

    return { transactions: transformedTransactions, error: null };
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

    // Transform the data to match our Category type
    const transformedCategories: Category[] = data.map(item => ({
      id: item.category_id,
      name: item.name,
      type: item.type as 'expense' | 'income',
      color: item.color || '#cccccc'
    }));

    return { categories: transformedCategories, error: null };
  } catch (error) {
    console.error('Exception fetching categories:', error);
    return { categories: [], error: error as Error };
  }
};

/**
 * Inserts a transaction into Supabase
 */
export const insertTransaction = async (transaction: Transaction & { user_email: string }) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        transaction_id: transaction.id,
        amount: transaction.amount,
        category_id: transaction.categoryId,
        date: transaction.date,
        description: transaction.description || '',
        type: transaction.type,
        emotional_state: transaction.emotionalState || 'neutral',
        user_email: transaction.user_email
      }]);

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
export const updateTransaction = async (transaction: Transaction, userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount: transaction.amount,
        category_id: transaction.categoryId,
        date: transaction.date,
        description: transaction.description || '',
        type: transaction.type,
        emotional_state: transaction.emotionalState || 'neutral'
      })
      .eq('transaction_id', transaction.id)
      .eq('user_email', userEmail);

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
export const deleteTransaction = async (transactionId: string, userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', transactionId)
      .eq('user_email', userEmail);

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
export const insertCategory = async (category: Category, userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        category_id: category.id,
        name: category.name,
        type: category.type,
        color: category.color || '#cccccc',
        user_email: userEmail
      }]);

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
export const updateCategory = async (category: Category, userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        type: category.type,
        color: category.color
      })
      .eq('category_id', category.id)
      .eq('user_email', userEmail);

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
export const deleteCategory = async (categoryId: string, userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', categoryId)
      .eq('user_email', userEmail);

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
