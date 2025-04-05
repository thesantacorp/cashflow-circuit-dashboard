
import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { TransactionContext } from "./context";
import { useUuidManagement } from "./hooks/useUuidManagement";
import { useTransactionOperations } from "./hooks/useTransactionOperations";
import { useDataOperations } from "./hooks/useDataOperations";

// Create provider
export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the extracted hooks
  const { 
    userUuid, 
    userEmail, 
    generateUserUuid,
    checkUuidExists,
    getUserEmail,
    syncStatus,
    forceSyncToCloud,
    checkSyncStatus 
  } = useUuidManagement();
  
  const { 
    state, 
    dispatch, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    addCategory, 
    deleteCategory 
  } = useTransactionOperations(userUuid);
  
  const { 
    importData, 
    replaceAllData, 
    getTransactionsByType, 
    getCategoriesByType, 
    getCategoryById, 
    getTotalByType 
  } = useDataOperations(state, userUuid, dispatch);

  // Listen for app visibility changes to auto-sync
  useEffect(() => {
    const handleAppVisible = async () => {
      if (userUuid && userEmail && syncStatus === 'local-only') {
        console.log('App is visible again, checking UUID sync status...');
        await checkSyncStatus();
      }
    };

    window.addEventListener('app-visible', handleAppVisible);
    
    // Also check sync status on mount
    if (userUuid && userEmail) {
      checkSyncStatus();
    }

    return () => {
      window.removeEventListener('app-visible', handleAppVisible);
    };
  }, [userUuid, userEmail, syncStatus, checkSyncStatus]);

  return (
    <TransactionContext.Provider
      value={{
        state,
        dispatch,
        userUuid,
        userEmail,
        syncStatus,
        generateUserUuid,
        checkUuidExists,
        getUserEmail,
        forceSyncToCloud,
        checkSyncStatus,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        getTransactionsByType,
        getCategoriesByType,
        getCategoryById,
        getTotalByType,
        importData,
        replaceAllData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
