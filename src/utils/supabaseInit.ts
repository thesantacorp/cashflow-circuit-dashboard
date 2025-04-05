import { getSupabaseClient, checkDatabaseConnection } from './supabase/client';
import { toast } from 'sonner';
import { Queue } from './queue';

// Create a queue for syncing operations that can be retried
export const syncQueue = new Queue();

// Keep track of initialization state
let isInitialized = false;
let connectionStatus = false;

// Initialize Supabase with logging and error handling
export const initializeSupabase = async (): Promise<boolean> => {
  if (isInitialized) {
    console.log('Supabase already initialized, connection status:', connectionStatus);
    return connectionStatus;
  }
  
  console.log('Initializing Supabase connection...');
  try {
    // Check if we can connect to Supabase
    const connected = await checkDatabaseConnection();
    
    if (connected) {
      console.log('✅ Supabase connection successful');
    } else {
      console.error('❌ Supabase connection failed');
    }
    
    isInitialized = true;
    connectionStatus = connected;
    
    // Start processing the sync queue if we're connected
    if (connected) {
      // Process queue items periodically
      setInterval(() => {
        if (navigator.onLine) {
          syncQueue.processQueue().catch(console.error);
        }
      }, 30000); // every 30 seconds
      
      // Also process immediately
      syncQueue.processQueue().catch(console.error);
    }
    
    return connected;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    isInitialized = true;
    connectionStatus = false;
    return false;
  }
};

// Check if connection is available (can be called multiple times)
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking Supabase connection...');
    // Test connection by making a simple query
    const supabase = getSupabaseClient();
    
    // Added a simple timeout to avoid waiting too long
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.log('Supabase connection check timed out');
        resolve(false);
      }, 5000); // 5 second timeout
    });
    
    const connectionPromise = new Promise<boolean>(async (resolve) => {
      try {
        const { data, error } = await supabase.from('_test_connection')
          .select('*').limit(1);
          
        const connected = !error;
        console.log(`Supabase connection check: ${connected ? 'success' : 'failed'}`);
        
        if (error) {
          console.error('Supabase connection error:', error);
        }
        
        resolve(connected);
      } catch (err) {
        console.error('Supabase connection exception:', err);
        resolve(false);
      }
    });
    
    // Take the first result
    const connected = await Promise.race([connectionPromise, timeoutPromise]);
    
    // Update stored status
    connectionStatus = connected;
    return connected;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    connectionStatus = false;
    return false;
  }
};

// Check if initialization has been attempted
export const isSupabaseInitialized = (): boolean => {
  return isInitialized;
};

// Get current connection status without making a new request
export const getConnectionStatus = (): boolean => {
  return connectionStatus;
};

// Reset connection status (e.g. after a long period of inactivity)
export const resetConnectionStatus = (): void => {
  connectionStatus = false;
};
