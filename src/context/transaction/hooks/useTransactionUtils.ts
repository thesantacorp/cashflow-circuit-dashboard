
import { useCallback } from 'react';
import { TransactionState } from '../types';
import { Transaction, TransactionType, Category } from '@/types';
import { toast } from 'sonner';

/**
 * Hook to provide utility functions for transactions
 */
export const useTransactionUtils = (state: TransactionState) => {
  /**
   * Get transactions filtered by type
   */
  const getTransactionsByType = useCallback((type: TransactionType): Transaction[] => {
    return state.transactions.filter(t => t.type === type);
  }, [state.transactions]);

  /**
   * Get categories filtered by type
   */
  const getCategoriesByType = useCallback((type: TransactionType): Category[] => {
    return state.categories.filter(c => c.type === type);
  }, [state.categories]);

  /**
   * Get a category by its ID
   */
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return state.categories.find(c => c.id === id);
  }, [state.categories]);

  /**
   * Get total amount by transaction type
   */
  const getTotalByType = useCallback((type: TransactionType): number => {
    return state.transactions
      .filter(t => t.type === type)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [state.transactions]);

  /**
   * Remove duplicate transactions
   */
  const deduplicate = useCallback((): TransactionState => {
    const uniqueTransactions = Array.from(
      new Map(state.transactions.map(item => [item.id, item])).values()
    );
    
    if (uniqueTransactions.length !== state.transactions.length) {
      toast.success(`Removed ${state.transactions.length - uniqueTransactions.length} duplicate transactions`);
      
      return {
        ...state,
        transactions: uniqueTransactions
      };
    }
    
    return state;
  }, [state]);

  return {
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    deduplicate
  };
};
