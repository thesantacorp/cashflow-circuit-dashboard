
import { Transaction, TransactionType, Category } from "@/types";
import { toast } from "sonner";
import { TransactionState } from "../types";

export function useDataOperations(
  state: TransactionState, 
  userUuid: string | null,
  dispatch: React.Dispatch<any>
) {
  // Import transactions
  const importData = (transactions: Transaction[]) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "IMPORT_TRANSACTIONS",
      payload: transactions
    });
    toast.success(`${transactions.length} transactions imported successfully`);
    return true;
  };

  // Replace all transactions
  const replaceAllData = (transactions: Transaction[]) => {
    if (!userUuid) {
      toast.error("Please generate a User ID first");
      return false;
    }
    
    dispatch({
      type: "REPLACE_ALL_DATA",
      payload: transactions
    });
    toast.success(`All data replaced with ${transactions.length} imported transactions`);
    return true;
  };

  // Get transactions by type
  const getTransactionsByType = (type: TransactionType) => {
    return state.transactions.filter((transaction) => transaction.type === type);
  };

  // Get categories by type
  const getCategoriesByType = (type: TransactionType) => {
    return state.categories.filter((category) => category.type === type);
  };

  // Get category by id
  const getCategoryById = (id: string) => {
    return state.categories.find((category) => category.id === id);
  };

  // Get total amount by type
  const getTotalByType = (type: TransactionType) => {
    return state.transactions
      .filter((transaction) => transaction.type === type)
      .reduce((acc, transaction) => acc + transaction.amount, 0);
  };
  
  return {
    importData,
    replaceAllData,
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType
  };
}
