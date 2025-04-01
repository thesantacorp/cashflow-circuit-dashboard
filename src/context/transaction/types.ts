
import { Category, Transaction, TransactionType } from "@/types";

// Define action types
export type TransactionAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "IMPORT_TRANSACTIONS"; payload: Transaction[] };

// Define state type
export interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
}

// Context Props
export interface TransactionContextProps {
  state: TransactionState;
  dispatch: React.Dispatch<TransactionAction>;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
  importData: (transactions: Transaction[]) => void;
}
