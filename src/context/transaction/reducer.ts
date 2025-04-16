
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
      // Check if this update would create a duplicate (same name and type, different id)
      const duplicateAfterUpdate = state.categories.some(c => 
        c.id !== action.payload.id && 
        c.type === action.payload.type && 
        c.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      
      if (duplicateAfterUpdate) {
        toast.error(`Category "${action.payload.name}" already exists`);
        return state;
      }
      
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
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
      return {
        ...state,
        transactions: [...state.transactions, ...action.payload],
      };
    case "REPLACE_ALL_DATA":
      return {
        ...state,
        transactions: action.payload,
      };
    default:
      return state;
  }
}
