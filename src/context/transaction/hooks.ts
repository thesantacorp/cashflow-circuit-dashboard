
import { useContext } from "react";
import { TransactionContext } from "./context";
import { Transaction } from "@/types";

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }

  // Add the getAllTransactions function if it's not already defined in the context
  if (!context.getAllTransactions) {
    context.getAllTransactions = () => {
      return context.state.transactions;
    };
  }

  return context;
}
