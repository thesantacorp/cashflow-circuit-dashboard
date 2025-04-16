import { TransactionState } from "../types";
import { Category, Transaction, TransactionType } from "@/types";

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
    
    // Create a map to track unique transactions based on ID
    const uniqueTransactionsById = new Map<string, Transaction>();
    
    // Create another map to track potential duplicates based on date+amount+description
    const potentialDuplicatesMap = new Map<string, Transaction[]>();
    
    // First pass: collect all transactions by their IDs and fingerprints
    state.transactions.forEach(transaction => {
      if (!transaction.id) {
        console.warn("Found transaction without ID:", transaction);
        return; // Skip transactions without ID
      }
      
      // Add to unique transactions map (by ID)
      uniqueTransactionsById.set(transaction.id, transaction);
      
      // Generate fingerprint for fuzzy duplicate detection
      const fingerprint = `${transaction.date}-${transaction.amount}-${transaction.type}-${transaction.categoryId || ''}`;
      
      if (!potentialDuplicatesMap.has(fingerprint)) {
        potentialDuplicatesMap.set(fingerprint, []);
      }
      
      potentialDuplicatesMap.get(fingerprint)?.push(transaction);
    });
    
    // Second pass: detect and handle potential duplicates 
    // (transactions with same date, amount, type and category)
    potentialDuplicatesMap.forEach((transactions, fingerprint) => {
      if (transactions.length > 1) {
        console.log(`Found ${transactions.length} potential duplicates with fingerprint: ${fingerprint}`);
        
        // Sort duplicates by ID to ensure consistent selection
        transactions.sort((a, b) => a.id.localeCompare(b.id));
        
        // Keep the first occurrence, remove others from uniqueTransactionsById
        const primaryTransaction = transactions[0];
        
        transactions.slice(1).forEach(duplicate => {
          // If the ID starts with "imported-" it's likely an imported transaction
          // If another transaction has the same signature, remove the imported one
          const shouldRemove = duplicate.id.startsWith('imported-') && 
                               !primaryTransaction.id.startsWith('imported-');
          
          // If this is an imported transaction and there's a non-imported one with same signature,
          // remove the imported one to avoid duplication
          if (shouldRemove) {
            uniqueTransactionsById.delete(duplicate.id);
            console.log(`Removed duplicate imported transaction: ${duplicate.id}`);
          }
        });
      }
    });
    
    const dedupedTransactions = Array.from(uniqueTransactionsById.values());
    console.log(`Deduplication complete. Original: ${state.transactions.length}, Deduped: ${dedupedTransactions.length}`);
    
    // Return updated state with deduplicated transactions
    return {
      ...state,
      transactions: dedupedTransactions
    };
  };

  return {
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    deduplicate
  };
};
