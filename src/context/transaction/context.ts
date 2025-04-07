
import { createContext, useContext } from "react";
import { Transaction, Category, TransactionType } from "@/types";

// Define the state shape
interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
}

// Define the context shape
interface TransactionContextType {
  state: TransactionState;
  dispatch: React.Dispatch<any>;
  addTransaction: (transaction: Omit<Transaction, "id">) => boolean;
  updateTransaction: (transaction: Transaction) => boolean;
  deleteTransaction: (id: string) => boolean;
  addCategory: (category: Omit<Category, "id">) => boolean;
  deleteCategory: (id: string) => boolean;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoriesByType: (type: TransactionType) => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: TransactionType) => number;
  importData: (data: Partial<TransactionState>) => void;
  replaceAllData: (data: TransactionState) => void;
  lastSyncTime: Date | null;
  refreshData?: () => Promise<boolean>;
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
