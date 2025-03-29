
import { useContext } from "react";
import { TransactionContext } from "./context";

// Create hook
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
