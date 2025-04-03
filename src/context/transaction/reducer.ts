
import { Transaction, Category } from "@/types";
import { allDefaultCategories } from "./defaultCategories";
import { toast } from "sonner";
import { TransactionAction, TransactionState } from "./types";

export const initialState: TransactionState = {
  transactions: [],
  categories: allDefaultCategories,
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
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case "UPDATE_CATEGORY":
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
