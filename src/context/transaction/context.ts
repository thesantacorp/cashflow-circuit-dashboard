
import { createContext, useContext } from "react";
import { Transaction, Category, TransactionType } from "@/types";

// Define the state shape
interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  nextTransactionId?: number;
  nextCategoryId?: number;
}

// Define the context shape
interface TransactionContextType {
  state: TransactionState;
  dispatch: React.Dispatch<any>;
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
  refreshData: (silent?: boolean) => Promise<boolean>;
  deduplicate: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  isLoading?: boolean;
}

// Create the context
export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Create a hook to use the context
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
