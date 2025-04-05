
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
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "IMPORT_TRANSACTIONS"; payload: Transaction[] }
  | { type: "REPLACE_ALL_DATA"; payload: Transaction[] };

export type TransactionContextType = {
  state: TransactionState;
  dispatch: Dispatch<TransactionAction>;
  addTransaction: (transaction: Omit<Transaction, "id">) => boolean;
  updateTransaction: (transaction: Transaction) => boolean;
  deleteTransaction: (id: string) => boolean;
  addCategory: (category: Omit<Category, "id">) => boolean;
  deleteCategory: (id: string) => boolean;
  getTransactionsByType: (type: "income" | "expense") => Transaction[];
  getCategoriesByType: (type: "income" | "expense") => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: "income" | "expense") => number;
  importData: (data: Partial<TransactionState>) => void;
  replaceAllData: (data: TransactionState) => void;
};
