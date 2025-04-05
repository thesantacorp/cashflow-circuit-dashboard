
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
      if (userUuid && userEmail) {
        console.log('App is visible again, checking UUID sync status...');
        await checkSyncStatus();
      }
    };

    window.addEventListener('app-visible', handleAppVisible);
    
    // Check sync status on mount - always check regardless of current status
    if (userUuid && userEmail) {
      console.log('App loaded, verifying UUID sync status...');
      checkSyncStatus();
    }

    return () => {
      window.removeEventListener('app-visible', handleAppVisible);
    };
  }, [userUuid, userEmail, checkSyncStatus]);

  // Initial sync attempt when provider loads
  useEffect(() => {
    const initialSync = async () => {
      if (userUuid && userEmail && syncStatus === 'local-only') {
        console.log('Initial load, attempting to sync local UUID to cloud...');
        await forceSyncToCloud();
      }
    };
    
    initialSync();
  }, [userUuid, userEmail, syncStatus, forceSyncToCloud]);

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
