
import { useContext } from "react";
import { TransactionContext } from "./context";
import { Transaction } from "@/types";

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }

  return context;
}
