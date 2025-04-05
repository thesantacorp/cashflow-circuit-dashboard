
import { Category, Transaction, TransactionType } from "@/types";

// Define action types
export type TransactionAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "IMPORT_TRANSACTIONS"; payload: Transaction[] }
  | { type: "REPLACE_ALL_DATA"; payload: Transaction[] };

// Define state type
export interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
}

// Context Props
export interface TransactionContextProps {
  state: TransactionState;
  dispatch: React.Dispatch<TransactionAction>;
  userUuid: string | null;
  userEmail: string | null;
  generateUserUuid: (email?: string) => string;
  checkUuidExists: () => boolean;
  getUserEmail: () => string | null;
  addTransaction: (transaction: Omit<Transaction, "id">) => boolean;
  updateTransaction: (transaction: Transaction) => boolean;
  deleteTransaction: (id: string) => boolean;
  addCategory: (category: Omit<Category, "id">) => boolean;
  deleteCategory: (id: string) => boolean;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
  importData: (transactions: Transaction[]) => boolean;
  replaceAllData: (transactions: Transaction[]) => boolean;
}
