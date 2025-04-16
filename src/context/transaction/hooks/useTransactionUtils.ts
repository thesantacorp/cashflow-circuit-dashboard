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
    
    // Create a map for unique transactions
    const uniqueTransactions = new Map<string, Transaction>();
    
    // Track potential duplicates with a more reliable fingerprint
    const seenFingerprints = new Set<string>();
    const duplicatesFound = new Set<string>();
    
    // First pass: identify duplicates with more reliable detection
    state.transactions.forEach(transaction => {
      // Skip invalid transactions
      if (!transaction.id || !transaction.date || !transaction.amount) {
        console.warn("Found invalid transaction:", transaction);
        return;
      }
      
      // Create a robust fingerprint that considers the core transaction properties
      // Format the date consistently by taking just the date part
      const dateStr = new Date(transaction.date).toISOString().split('T')[0];
      const fingerprint = `${dateStr}:${transaction.amount}:${transaction.type}:${transaction.categoryId || 'uncategorized'}:${transaction.description || ''}`;
      
      if (seenFingerprints.has(fingerprint)) {
        // This is a duplicate based on core properties
        duplicatesFound.add(transaction.id);
        console.log(`Detected duplicate transaction: ${transaction.id} with fingerprint ${fingerprint}`);
        
        // If this is an imported transaction and we've seen this fingerprint before,
        // mark it as a duplicate to be removed
        if (transaction.id.startsWith('imported-')) {
          console.log(`Marking imported duplicate for removal: ${transaction.id}`);
        } else {
          // Add non-imported transactions to our unique map to ensure they're kept
          if (!uniqueTransactions.has(transaction.id)) {
            uniqueTransactions.set(transaction.id, transaction);
          }
        }
      } else {
        // First time seeing this fingerprint
        seenFingerprints.add(fingerprint);
        uniqueTransactions.set(transaction.id, transaction);
      }
    });
    
    // Create the final deduplicated transactions array
    const dedupedTransactions = Array.from(uniqueTransactions.values());
    
    // Log deduplication results
    const removedCount = state.transactions.length - dedupedTransactions.length;
    console.log(`Deduplication complete. Original: ${state.transactions.length}, Deduped: ${dedupedTransactions.length}`);
    
    if (removedCount > 0) {
      toast.info(`Removed ${removedCount} duplicate transactions`);
    }
    
    // Return updated state with deduplicated transactions
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
    
    // Create a set of existing transaction fingerprints for better matching
    const existingFingerprints = new Set<string>();
    
    // Build fingerprints from existing transactions
    state.transactions.forEach(t => {
      if (!t.date || !t.amount) return;
      
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const fingerprint = `${dateStr}:${t.amount}:${t.type}:${t.categoryId || 'uncategorized'}:${t.description || ''}`;
      existingFingerprints.add(fingerprint);
    });
    
    // Filter out transactions that already exist using improved matching
    const newTransactions = transactions.filter(transaction => {
      if (!transaction.date || !transaction.amount) return false;
      
      const dateStr = new Date(transaction.date).toISOString().split('T')[0];
      const fingerprint = `${dateStr}:${transaction.amount}:${transaction.type}:${transaction.categoryId || 'uncategorized'}:${transaction.description || ''}`;
      
      // Keep this transaction only if we haven't seen its fingerprint
      return !existingFingerprints.has(fingerprint);
    });
    
    console.log(`Filtered out ${transactions.length - newTransactions.length} already existing transactions from import`);
    return newTransactions;
  };

  const validateTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => {
      // Check for required fields
      if (!t.id || !t.type || typeof t.amount !== 'number' || !t.date) {
        console.warn('Filtering out invalid transaction:', t);
        return false;
      }
      
      // Ensure amount is a valid number
      if (isNaN(t.amount)) {
        console.warn('Filtering out transaction with invalid amount:', t);
        return false;
      }
      
      // Validate date format
      try {
        new Date(t.date);
      } catch (e) {
        console.warn('Filtering out transaction with invalid date:', t);
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
