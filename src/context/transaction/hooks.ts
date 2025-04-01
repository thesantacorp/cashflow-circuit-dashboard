import { useContext } from "react";
import { TransactionContext } from "./context";
import { Transaction } from "@/types";

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }

  const extendedContext = {
    ...context,
    importData: (transactions: Transaction[]) => {
      const validTransactions = transactions.filter(t => 
        t.type && t.amount && t.categoryId && t.date
      );
      
      if (validTransactions.length === 0) {
        throw new Error("No valid transactions found to import");
      }
      
      context.dispatch({
        type: "IMPORT_TRANSACTIONS",
        payload: validTransactions
      });
    }
  };

  return extendedContext;
}
