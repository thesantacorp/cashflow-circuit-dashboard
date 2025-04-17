
import { TransactionType } from "@/types";

export function useDataOperations(state, dispatch) {
  // Import data (partial)
  const importData = (data) => {
    dispatch({ type: "IMPORT_DATA", payload: data });
  };

  // Replace all data
  const replaceAllData = (data) => {
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
  };

  // Get transactions by type
  const getTransactionsByType = (type) => {
    return state.transactions.filter(t => t.type === type);
  };

  // Get categories by type
  const getCategoriesByType = (type) => {
    const filteredCategories = state.categories.filter(c => c.type === type);
    console.log(`[getCategoriesByType] Found ${filteredCategories.length} ${type} categories`);
    return filteredCategories;
  };

  // Get category by ID
  const getCategoryById = (id) => {
    return state.categories.find(c => c.id === id);
  };

  // Get total by type
  const getTotalByType = (type) => {
    return getTransactionsByType(type).reduce((acc, t) => acc + t.amount, 0);
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
