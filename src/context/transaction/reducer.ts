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
      const { id, name, type, color } = action.payload;
      
      // Check for duplicates (excluding the category being updated)
      const duplicateAfterUpdate = state.categories.some(c => 
        c.id !== id && 
        c.type === type && 
        c.name.toLowerCase() === name.toLowerCase()
      );
      
      if (duplicateAfterUpdate) {
        console.error(`Cannot update: A category named "${name}" already exists for type ${type}`);
        return state;
      }
      
      // Update the existing category
      const updatedCategories = state.categories.map(c => 
        c.id === id ? action.payload : c
      );
      
      console.log('Updated categories in reducer:', updatedCategories);
      
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
        const key = `${category.type}-${category.name.toLowerCase()}`;
        categoryMap.set(key, category);
      }
      
      // Then add provided categories, which will override defaults with same name/type
      if (action.payload.categories) {
        for (const category of action.payload.categories) {
          const key = `${category.type}-${category.name.toLowerCase()}`;
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
      
      // Remove duplicate categories by name and type
      const dedupedCategoryMap = new Map();
      
      // Process categories to keep only one per name/type combination
      for (const category of state.categories) {
        const key = `${category.type}-${category.name.toLowerCase()}`;
        // If we already have this category type/name combination,
        // keep the first one we encountered
        if (!dedupedCategoryMap.has(key)) {
          dedupedCategoryMap.set(key, category);
        }
      }
      
      return {
        ...state,
        transactions: dedupedTransactions,
        categories: Array.from(dedupedCategoryMap.values()),
      };
    default:
      return state;
  }
}
