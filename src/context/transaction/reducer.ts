
import { Transaction, Category } from "@/types";
import { allDefaultCategories } from "./defaultCategories";
import { toast } from "sonner";
import { TransactionAction, TransactionState } from "./types";

export const initialState: TransactionState = {
  transactions: [],
  categories: allDefaultCategories,
  nextTransactionId: 1,
  nextCategoryId: 100, // Starting after default categories
};

export function transactionReducer(
  state: TransactionState,
  action: TransactionAction
): TransactionState {
  switch (action.type) {
    case "ADD_TRANSACTION":
      // Check if a transaction with the same ID already exists
      const existingTransaction = state.transactions.find(t => t.id === action.payload.id);
      if (existingTransaction) {
        toast.info("This transaction already exists");
        return state;
      }
      
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== action.payload),
      };
    case "ADD_CATEGORY":
      // Check if a category with the same name and type already exists
      const existingCategory = state.categories.find(
        (c) => c.name.toLowerCase() === action.payload.name.toLowerCase() && 
               c.type === action.payload.type
      );
      
      if (existingCategory) {
        toast.error(`Category "${action.payload.name}" already exists`);
        return state;
      }
      
      return {
        ...state,
        categories: [...state.categories, action.payload],
        nextCategoryId: state.nextCategoryId + 1,
      };
    case "UPDATE_CATEGORY":
      // Extract updated category details from payload
      const updatedCategory = action.payload;
      
      // Check for duplicates (excluding the category being updated)
      const duplicateCategory = state.categories.find(c => 
        c.id !== updatedCategory.id && 
        c.type === updatedCategory.type && 
        c.name.toLowerCase() === updatedCategory.name.toLowerCase()
      );
      
      if (duplicateCategory) {
        console.error(`Cannot update: A category named "${updatedCategory.name}" already exists for type ${updatedCategory.type}`);
        toast.error(`A category named "${updatedCategory.name}" already exists for ${updatedCategory.type}`);
        return state;
      }
      
      console.log('Reducer - Updating category with ID:', updatedCategory.id);
      console.log('Reducer - Original categories:', state.categories);
      
      // Update the existing category - IMPORTANT: Preserve the same ID
      const updatedCategories = state.categories.map(c => {
        if (c.id === updatedCategory.id) {
          console.log('Reducer - Found category to update:', c);
          console.log('Reducer - Updating to:', updatedCategory);
          return updatedCategory;
        }
        return c;
      });
      
      console.log('Reducer - Updated categories:', updatedCategories);
      
      return {
        ...state,
        categories: updatedCategories,
      };
    case "DELETE_CATEGORY":
      const hasTransactions = state.transactions.some(
        (transaction) => transaction.categoryId === action.payload
      );
      
      if (hasTransactions) {
        toast.error("Cannot delete a category that has transactions");
        return state;
      }
      
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.payload),
      };
    case "IMPORT_TRANSACTIONS":
      // Filter out duplicate transactions
      const newTransactions = action.payload.filter(
        newTx => !state.transactions.some(existingTx => existingTx.id === newTx.id)
      );
      
      return {
        ...state,
        transactions: [...state.transactions, ...newTransactions],
      };
    case "IMPORT_CATEGORIES":
      // Merge categories, keeping existing ones intact
      const newCategories = action.payload.filter(
        newCat => !state.categories.some(
          existingCat => existingCat.id === newCat.id
        )
      );
      
      return {
        ...state,
        categories: [...state.categories, ...newCategories],
      };
    case "REPLACE_ALL_DATA":
      // Deduplicate transactions in the replacement data
      const uniqueTransactions = Array.from(
        new Map(action.payload.transactions?.map(t => [t.id, t]) || []).values()
      );
      
      // Deduplicate categories by name and type
      const categoryMap = new Map();
      
      // First add default categories
      for (const category of allDefaultCategories) {
        const key = `${category.type}-${category.name.toLowerCase()}-${category.id}`;
        categoryMap.set(key, category);
      }
      
      // Then add provided categories, which will override defaults with same name/type
      if (action.payload.categories) {
        for (const category of action.payload.categories) {
          const key = `${category.type}-${category.name.toLowerCase()}-${category.id}`;
          categoryMap.set(key, category);
        }
      }
      
      return {
        ...state,
        transactions: uniqueTransactions || [],
        categories: Array.from(categoryMap.values()),
      };
    case "DEDUPLICATE_DATA":
      // Remove duplicate transactions by ID
      const dedupedTransactions = Array.from(
        new Map(state.transactions.map(t => [t.id, t])).values()
      );
      
      // Remove duplicate categories by ID (not just by name/type)
      const dedupedCategoryMap = new Map();
      
      // Process categories to ensure uniqueness by ID
      for (const category of state.categories) {
        const key = category.id;
        if (!dedupedCategoryMap.has(key)) {
          dedupedCategoryMap.set(key, category);
        }
      }
      
      // Extra step: ensure no duplicate names within same type
      const finalCategoriesMap = new Map();
      const processedNameTypeKeys = new Set();
      
      for (const category of dedupedCategoryMap.values()) {
        const nameTypeKey = `${category.type}-${category.name.toLowerCase()}`;
        
        if (!processedNameTypeKeys.has(nameTypeKey)) {
          finalCategoriesMap.set(category.id, category);
          processedNameTypeKeys.add(nameTypeKey);
        } else {
          console.log(`Dropping duplicate category: ${category.name} (${category.id})`);
        }
      }
      
      // Update transactions that reference removed categories
      const validCategoryIds = new Set(Array.from(finalCategoriesMap.keys()));
      const updatedTransactions = dedupedTransactions.map(transaction => {
        if (transaction.categoryId && !validCategoryIds.has(transaction.categoryId)) {
          console.log(`Transaction ${transaction.id} references non-existent category ${transaction.categoryId}`);
          // Find a default category of the same type
          const defaultCategory = allDefaultCategories.find(c => c.type === transaction.type);
          if (defaultCategory) {
            console.log(`Reassigning to default category: ${defaultCategory.name} (${defaultCategory.id})`);
            return { ...transaction, categoryId: defaultCategory.id };
          }
        }
        return transaction;
      });
      
      return {
        ...state,
        transactions: updatedTransactions,
        categories: Array.from(finalCategoriesMap.values()),
      };
    case "REASSIGN_TRANSACTIONS":
      // Move transactions from one category to another
      const { fromCategoryId, toCategoryId } = action.payload;
      
      // Update all transactions that use the fromCategoryId
      const reassignedTransactions = state.transactions.map(transaction => {
        if (transaction.categoryId === fromCategoryId) {
          return { ...transaction, categoryId: toCategoryId };
        }
        return transaction;
      });
      
      return {
        ...state,
        transactions: reassignedTransactions,
      };
    default:
      return state;
  }
}
