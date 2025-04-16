
import { Dispatch } from "react";
import { Transaction, Category, TransactionType } from "@/types";

export type TransactionState = {
  transactions: Transaction[];
  categories: Category[];
  nextTransactionId: number;
  nextCategoryId: number;
};

export type TransactionAction =
  | { type: "SET_STATE"; payload: TransactionState }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "IMPORT_TRANSACTIONS"; payload: Transaction[] }
  | { type: "REPLACE_ALL_DATA"; payload: TransactionState };

export type TransactionContextType = {
  state: TransactionState;
  dispatch: Dispatch<TransactionAction>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<boolean>;
  updateTransaction: (transaction: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addCategory: (category: Omit<Category, "id">) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
  importData: (data: Partial<TransactionState>) => void;
  replaceAllData: (data: TransactionState) => void;
  lastSyncTime: Date | null;
  refreshData?: () => Promise<boolean>;
  deduplicate: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  isLoading?: boolean;
};
