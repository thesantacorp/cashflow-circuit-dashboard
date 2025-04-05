
import React, { useEffect } from "react";
import { TransactionContext } from "./context";
import { useUuidManagement } from "./hooks/useUuidManagement";
import { useTransactionOperations } from "./hooks/useTransactionOperations";
import { useDataOperations } from "./hooks/useDataOperations";
import { toast } from "sonner";
import { checkSupabaseConnection } from "@/utils/supabaseInit";

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
    connectionVerified,
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
        console.log('App is visible again, checking Supabase connection...');
        
        try {
          // First check if Supabase is available
          const isConnected = await checkSupabaseConnection();
          
          if (isConnected) {
            console.log('Supabase connection is available, checking UUID sync status...');
            try {
              await checkSyncStatus();
            } catch (error) {
              console.error('Error checking UUID sync status on visibility change:', error);
              // Don't show toast to avoid spamming the user when returning to tab
            }
          } else {
            console.log('Supabase connection is not available, skipping sync check');
          }
        } catch (error) {
          console.error('Error checking connection on visibility change:', error);
        }
      }
    };

    window.addEventListener('app-visible', handleAppVisible);
    
    // Check sync status on mount if we have userUuid and email
    if (userUuid && userEmail && syncStatus !== 'synced') {
      console.log('Component mounted, verifying UUID sync status...');
      checkSyncStatus().catch(error => {
        console.error('Error on initial sync status check:', error);
      });
    }

    return () => {
      window.removeEventListener('app-visible', handleAppVisible);
    };
  }, [userUuid, userEmail, syncStatus, checkSyncStatus]);

  // Handle sync status transitions
  useEffect(() => {
    // When transitioning to synced, show a confirmation
    if (syncStatus === 'synced' && userUuid && userEmail) {
      console.log('UUID is now synced with Supabase');
    }
    
    // When first receiving errors, try to auto-recover
    if (syncStatus === 'error' && userUuid && userEmail) {
      console.log('Sync error detected, will retry once after delay');
      const retryTimer = setTimeout(() => {
        console.log('Attempting recovery from sync error...');
        forceSyncToCloud(true).catch(console.error);
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [syncStatus, userUuid, userEmail, forceSyncToCloud]);
  
  // Watch for online/offline transitions to handle sync retry
  useEffect(() => {
    if (connectionVerified && userUuid && userEmail && syncStatus === 'local-only') {
      console.log('Connection restored and UUID is local-only, checking sync status...');
      checkSyncStatus().catch(console.error);
    }
  }, [connectionVerified, userUuid, userEmail, syncStatus, checkSyncStatus]);

  return (
    <TransactionContext.Provider
      value={{
        state,
        dispatch,
        userUuid,
        userEmail,
        syncStatus,
        connectionVerified,
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
