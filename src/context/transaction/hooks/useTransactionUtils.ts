import { TransactionState } from "../types";
import { Category, Transaction, TransactionType } from "@/types";
import { toast } from "sonner";

export const useTransactionUtils = (state: TransactionState) => {
  const getTransactionsByType = (type: TransactionType): Transaction[] => {
    return state.transactions
      .filter((transaction) => transaction.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCategoriesByType = (type: TransactionType): Category[] => {
    return state.categories.filter((category) => category.type === type);
  };

  const getCategoryById = (id: string): Category | undefined => {
    return state.categories.find((category) => category.id === id);
  };

  const getTotalByType = (type: TransactionType): number => {
    return state.transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const deduplicate = (): TransactionState => {
    console.log("Running deduplication process...");
    
    if (!state.transactions || state.transactions.length === 0) {
      console.log("No transactions to deduplicate");
      return state;
    }
    
    const uniqueTransactions = new Map<string, Transaction>();
    const seenFingerprints = new Map<string, string>();
    const duplicatesFound = new Set<string>();
    
    const validTransactions = state.transactions.filter(transaction => {
      if (!transaction.id || !transaction.date || typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
        console.warn("Found invalid transaction, removing:", transaction);
        return false;
      }
      return true;
    });
    
    const sortedTransactions = [...validTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedTransactions.forEach(transaction => {
      const dateStr = new Date(transaction.date).toISOString().split('T')[0];
      const amountStr = transaction.amount.toFixed(2);
      const fingerprint = `${dateStr}:${amountStr}:${transaction.type}:${transaction.categoryId || 'uncategorized'}:${transaction.description || ''}`;
      
      if (seenFingerprints.has(fingerprint)) {
        const existingId = seenFingerprints.get(fingerprint)!;
        duplicatesFound.add(transaction.id);
        
        console.log(`Detected duplicate transaction: ${transaction.id} with fingerprint ${fingerprint}`);
        
        if (transaction.id.startsWith('imported-')) {
          console.log(`Marking imported duplicate for removal: ${transaction.id}`);
        } 
        else if (!existingId.includes('-') && transaction.id.includes('-')) {
          console.log(`Keeping transaction ${existingId} over ${transaction.id}`);
        }
        else {
          console.log(`Keeping first transaction ${existingId} over ${transaction.id}`);
        }
      } else {
        seenFingerprints.set(fingerprint, transaction.id);
        uniqueTransactions.set(transaction.id, transaction);
      }
    });
    
    const dedupedTransactions = Array.from(uniqueTransactions.values());
    
    const removedCount = state.transactions.length - dedupedTransactions.length;
    console.log(`Deduplication complete. Original: ${state.transactions.length}, Deduped: ${dedupedTransactions.length}`);
    
    return {
      ...state,
      transactions: dedupedTransactions
    };
  };

  const cleanImportedTransactions = (transactions: Transaction[]): Transaction[] => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    console.log(`Cleaning ${transactions.length} imported transactions`);
    
    const validTransactions = validateTransactions(transactions);
    console.log(`${validTransactions.length} valid transactions after validation`);
    
    const existingFingerprints = new Set<string>();
    
    state.transactions.forEach(t => {
      if (!t.date || typeof t.amount !== 'number' || isNaN(t.amount)) return;
      
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const amountStr = t.amount.toFixed(2);
      const fingerprint = `${dateStr}:${amountStr}:${t.type}:${t.categoryId || 'uncategorized'}:${t.description || ''}`;
      existingFingerprints.add(fingerprint);
    });
    
    const newTransactions = validTransactions.filter(transaction => {
      const dateStr = new Date(transaction.date).toISOString().split('T')[0];
      const amountStr = transaction.amount.toFixed(2);
      const fingerprint = `${dateStr}:${amountStr}:${transaction.type}:${transaction.categoryId || 'uncategorized'}:${transaction.description || ''}`;
      
      return !existingFingerprints.has(fingerprint);
    });
    
    console.log(`Filtered out ${validTransactions.length - newTransactions.length} already existing transactions from import`);
    return newTransactions;
  };

  const validateTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => {
      if (!t.id || !t.type || typeof t.amount !== 'number' || !t.date) {
        console.warn('Filtering out invalid transaction missing required fields:', t);
        return false;
      }
      
      if (isNaN(t.amount)) {
        console.warn('Filtering out transaction with invalid amount:', t);
        return false;
      }
      
      try {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) {
          console.warn('Filtering out transaction with invalid date:', t);
          return false;
        }
      } catch (e) {
        console.warn('Filtering out transaction with invalid date format:', t);
        return false;
      }
      
      return true;
    });
  };

  return {
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    deduplicate,
    cleanImportedTransactions,
    validateTransactions
  };
};
