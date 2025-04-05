
import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { TransactionContext } from "./context";
import { useUuidManagement } from "./hooks/useUuidManagement";
import { useTransactionOperations } from "./hooks/useTransactionOperations";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";

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
        try {
          const result = await forceSyncToCloud();
          if (result) {
            console.log('Initial sync succeeded');
          } else {
            console.log('Initial sync attempt failed, will retry later');
            // Schedule a retry after 5 seconds
            setTimeout(() => {
              console.log('Retrying initial sync...');
              forceSyncToCloud(true);
            }, 5000);
          }
        } catch (error) {
          console.error('Error during initial sync:', error);
        }
      }
    };
    
    initialSync();
  }, [userUuid, userEmail, syncStatus, forceSyncToCloud]);

  // Warn user when sync is still local-only after a while
  useEffect(() => {
    let syncCheckTimeout: number | null = null;
    
    if (userUuid && userEmail && syncStatus === 'local-only') {
      // Schedule a check after 30 seconds
      syncCheckTimeout = window.setTimeout(() => {
        if (syncStatus === 'local-only') {
          console.warn('UUID still not synced to cloud after timeout');
          toast.warning(
            'Your User ID is still stored locally only', 
            {
              description: 'Click "Verify Cloud Sync" to check database status',
              duration: 8000
            }
          );
        }
      }, 30000);
    }
    
    return () => {
      if (syncCheckTimeout) {
        clearTimeout(syncCheckTimeout);
      }
    };
  }, [userUuid, userEmail, syncStatus]);
  
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
