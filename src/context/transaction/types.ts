
import { Transaction, Category, TransactionType } from "@/types";

export interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  nextTransactionId?: number;
  nextCategoryId?: number;
}

export type TransactionAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "IMPORT_TRANSACTIONS"; payload: Transaction[] }
  | { type: "IMPORT_CATEGORIES"; payload: Category[] }
  | { type: "REPLACE_ALL_DATA"; payload: TransactionState }
  | { type: "DEDUPLICATE_DATA" }
  | { type: "REASSIGN_TRANSACTIONS"; payload: { fromCategoryId: string; toCategoryId: string } };

export interface ContextType {
  state: TransactionState;
  dispatch: React.Dispatch<TransactionAction>;
  addTransaction: (transaction: Omit<Transaction, "id">) => boolean;
  updateTransaction: (transaction: Transaction) => boolean;
  deleteTransaction: (id: string) => boolean;
  addCategory: (category: Omit<Category, "id">) => boolean;
  updateCategory: (category: Category) => boolean;
  deleteCategory: (id: string) => boolean;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
  importData: (data: Partial<TransactionState>) => void;
  replaceAllData: (data: TransactionState) => void;
  refreshData?: () => Promise<boolean>;
  lastSyncTime: Date | null;
  deduplicate: (showToast?: boolean) => boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  reassignTransactions: (fromCategoryId: string, toCategoryId: string) => boolean;
}
