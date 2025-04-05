
import { getSupabaseClient } from '../supabase/client';
import { Transaction, Category } from '@/types';

// Load user data from Supabase based on email and UUID
export const loadUserData = async (email: string, uuid: string): Promise<{transactions: number, categories: number}> => {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch user transactions from Supabase
    const { data: transactions, error: transactionsError } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_uuid', uuid);
      
    if (transactionsError) {
      throw new Error(`Error fetching transactions: ${transactionsError.message}`);
    }
    
    // Fetch user categories from Supabase
    const { data: categories, error: categoriesError } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_uuid', uuid);
      
    if (categoriesError) {
      throw new Error(`Error fetching categories: ${categoriesError.message}`);
    }
    
    // Get existing local data
    const existingTransactions: Transaction[] = JSON.parse(localStorage.getItem('transactions') || '[]');
    const existingCategories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');
    
    // Merge with priority to cloud data
    let mergedTransactions = [...existingTransactions];
    let mergedCategories = [...existingCategories];
    
    // If we have cloud transactions, use them
    if (transactions && transactions.length > 0) {
      mergedTransactions = transactions.map((t: any) => t.data);
      localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
    }
    
    // If we have cloud categories, use them
    if (categories && categories.length > 0) {
      mergedCategories = categories.map((c: any) => c.data);
      localStorage.setItem('categories', JSON.stringify(mergedCategories));
    }
    
    return {
      transactions: transactions ? transactions.length : 0,
      categories: categories ? categories.length : 0
    };
  } catch (error) {
    console.error('Error loading user data from Supabase:', error);
    throw error;
  }
};
