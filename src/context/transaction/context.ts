
import { createContext, useContext } from "react";
import { Transaction, Category, TransactionType } from "@/types";
import { ContextType } from "./types";

// Create the context
export const TransactionContext = createContext<ContextType | undefined>(undefined);

// Create a hook to use the context
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
