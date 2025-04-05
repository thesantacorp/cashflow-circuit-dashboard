
// This file is now just importing and re-exporting from context.ts for backward compatibility
import { useTransactions as useTransactionsFromContext } from "./context";

export const useTransactions = useTransactionsFromContext;
