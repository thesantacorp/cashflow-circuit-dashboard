
import { TransactionType } from "@/types";

export function useDataOperations(state, dispatch) {
  // Import data (partial)
  const importData = (data) => {
    dispatch({ type: "IMPORT_DATA", payload: data });
  };

  // Replace all data
  const replaceAllData = (data) => {
    console.log('Replacing all data:', data);
    dispatch({ type: "REPLACE_ALL_DATA", payload: data });
  };

  // Get transactions by type
  const getTransactionsByType = (type) => {
    return state.transactions.filter(t => t.type === type);
  };

  // Get categories by type
  const getCategoriesByType = (type) => {
    const filteredCategories = state.categories.filter(c => c.type === type);
    console.log(`[getCategoriesByType] Found ${filteredCategories.length} ${type} categories`, filteredCategories);
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

  // Add a new category
  const addCategory = (category) => {
    console.log('[useDataOperations] Adding category:', category);
    
    // Check if category with same name and type already exists
    const categoryExists = state.categories.some(
      c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type
    );
    
    if (categoryExists) {
      console.warn(`Category "${category.name}" already exists for type ${category.type}`);
      return false;
    }
    
    const newCategory = { ...category, id: crypto.randomUUID() };
    console.log('[useDataOperations] Created new category with ID:', newCategory.id);
    
    dispatch({ type: "ADD_CATEGORY", payload: newCategory });
    return true;
  };

  // Update an existing category
  const updateCategory = (category) => {
    console.log('[useDataOperations] Updating category:', category);
    
    // Check for duplicate before updating
    const duplicateExists = state.categories.some(
      c => c.id !== category.id && 
           c.name.toLowerCase() === category.name.toLowerCase() && 
           c.type === category.type
    );
    
    if (duplicateExists) {
      console.warn(`Cannot update: A category named "${category.name}" already exists for type ${category.type}`);
      return false;
    }
    
    dispatch({ type: "UPDATE_CATEGORY", payload: category });
    return true;
  };

  // Delete a category
  const deleteCategory = (id) => {
    console.log('[useDataOperations] Deleting category with ID:', id);
    
    // Check if category has transactions
    const hasTransactions = state.transactions.some(t => t.categoryId === id);
    
    if (hasTransactions) {
      console.warn('Cannot delete category with transactions');
      return false;
    }
    
    dispatch({ type: "DELETE_CATEGORY", payload: id });
    return true;
  };

  return {
    importData,
    replaceAllData,
    getTransactionsByType,
    getCategoriesByType,
    getCategoryById,
    getTotalByType,
    addCategory,
    updateCategory,
    deleteCategory
  };
}
