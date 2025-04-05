
import { useState } from 'react';
import { toast } from 'sonner';
import { ensureGrowTablesExist } from '@/utils/supabase/grow';
import { checkSupabaseConnection } from '@/utils/supabaseInit';

type ConnectionStatus = 'checking' | 'online' | 'offline';

export const useGrowDbInit = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  const checkConnectionAndInit = async () => {
    setError(null);
    
    // First check if we have a database connection
    setConnectionStatus('checking');
    const isConnected = await checkSupabaseConnection();
    setConnectionStatus(isConnected ? 'online' : 'offline');
    
    if (!isConnected) {
      setError("No database connection available");
      toast.error("No database connection", { 
        description: "Check your internet connection and try again" 
      });
      return false;
    }
    
    // Now proceed with table initialization
    const success = await checkTablesAndFetchProjects();
    return success;
  };

  const checkTablesAndFetchProjects = async () => {
    setError(null);
    
    try {
      // First, check if the tables exist and create them if needed
      setIsInitializing(true);
      console.log(`Initializing Grow tables (attempt ${initAttempts + 1})...`);
      
      const tablesInitialized = await ensureGrowTablesExist();
      setInitAttempts(prev => prev + 1);
      setIsInitializing(false);
      
      if (!tablesInitialized) {
        console.error("Failed to initialize Grow tables");
        setError("Failed to initialize projects database");
        return false;
      }
      
      // Tables are now initialized
      return true;
    } catch (err) {
      console.error("Error checking/initializing tables:", err);
      setError("Failed to initialize projects database");
      setIsInitializing(false);
      return false;
    }
  };

  return {
    isInitializing,
    initAttempts,
    error,
    connectionStatus,
    checkConnectionAndInit,
    checkTablesAndFetchProjects
  };
};
