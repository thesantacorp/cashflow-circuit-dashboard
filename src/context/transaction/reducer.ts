
import { TransactionState, ActionType } from "./types";
import { toast } from "sonner";

// Create reducer
export const transactionReducer = (state: TransactionState, action: ActionType): TransactionState => {
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
    case "DELETE_CATEGORY":
      // Check if any transactions are using this category
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
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};
