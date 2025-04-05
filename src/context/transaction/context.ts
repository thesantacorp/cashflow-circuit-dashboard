
import { createContext, useContext } from "react";
import { TransactionState, Transaction, Category } from "./types";

interface TransactionContextProps {
  state: TransactionState;
  dispatch: React.Dispatch<any>;
  userUuid: string | null;
  userEmail: string | null;
  syncStatus: 'synced' | 'syncing' | 'local-only' | 'error' | 'unknown';
  connectionVerified: boolean;
  generateUserUuid: (email: string) => Promise<string>;
  checkUuidExists: (uuid: string) => Promise<boolean>;
  getUserEmail: (uuid: string) => Promise<string | null>;
  forceSyncToCloud: (silent?: boolean) => Promise<boolean>;
  checkSyncStatus: () => Promise<boolean>;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  getTransactionsByType: (type: "expense" | "income") => Transaction[];
  getCategoriesByType: (type: "expense" | "income") => Category[];
  getCategoryById: (id: string) => Category | undefined;
  getTotalByType: (type: "expense" | "income") => number;
  importData: (data: any) => boolean;
  replaceAllData: (data: any) => boolean;
}

export const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);

export const useTransactions = (): TransactionContextProps => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
