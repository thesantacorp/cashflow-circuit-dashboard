
import { Dispatch } from "react";
import { Transaction, Category } from "@/types";

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
  | { type: "DELETE_TRANSACTION"; payload: { id: number } }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: { id: number } };

export type TransactionContextType = {
  state: TransactionState;
  dispatch: Dispatch<TransactionAction>;
  userUuid: string | null;
  userEmail: string | null;
  syncStatus?: 'synced' | 'local-only' | 'unknown';
  generateUserUuid: (email: string) => Promise<string>;
  checkUuidExists: () => boolean;
  getUserEmail: () => string | null;
  forceSyncToCloud?: () => Promise<boolean>;
  checkSyncStatus?: () => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => number;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: number) => void;
  addCategory: (category: Omit<Category, "id">) => number;
  deleteCategory: (id: number) => void;
  getTransactionsByType: (type: "income" | "expense") => Transaction[];
  getCategoriesByType: (type: "income" | "expense") => Category[];
  getCategoryById: (id: number) => Category | undefined;
  getTotalByType: (type: "income" | "expense") => number;
  importData: (jsonData: string) => boolean;
  replaceAllData: (data: TransactionState) => void;
};
