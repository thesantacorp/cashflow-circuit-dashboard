
import { ensureUuidTableExists, getSupabaseClient, storeUserUuid } from './supabase/index';
import { verifySupabaseSetup, attemptSupabaseSetupFix } from './supabaseVerification';
import { toast } from 'sonner';

const CONNECTION_TIMEOUT = 12000; // 12 seconds timeout
const MAX_RETRY_ATTEMPTS = 2;

// Enhanced Supabase initialization with retry logic
export async function initializeSupabase(): Promise<boolean> {
  let retryCount = 0;
  let lastError: Error | null = null;

  const attemptConnection = async (): Promise<boolean> => {
    try {
      console.log(`Initializing Supabase connection (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS + 1})...`);
      toast.loading('Connecting to cloud database...', { 
        id: 'supabase-init',
        description: retryCount > 0 ? `Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS + 1}` : undefined
      });
      
      // Get the initialized client
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.error('Failed to initialize Supabase client');
        toast.error('Supabase client initialization failed', { id: 'supabase-init' });
        return false;
      }
      
      // Set up connection timeout
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT);
      });
      
      // Run comprehensive verification with timeout
      try {
        const verification = await Promise.race([
          verifySupabaseSetup(),
          timeoutPromise
        ]) as any;
        
        console.log('Supabase verification results:', verification);
        
        // If connected but table doesn't exist, try to create it
        if (verification.connected && !verification.tableExists) {
          console.log('Connected to Supabase but table missing, attempting to create...');
          await attemptSupabaseSetupFix();
          
          // Re-verify after fix attempt
          const reverify = await verifySupabaseSetup();
          if (reverify.tableExists) {
            console.log('Table created successfully');
            toast.success('Connected to cloud database successfully', { id: 'supabase-init' });
            return true;
          } else {
            console.warn('Failed to create table automatically');
            toast.warning('Connected to database but table setup failed', { 
              id: 'supabase-init',
              description: 'Some cloud features may not work properly'
            });
            return false;
          }
        }
        
        // Success case - connected and table exists
        if (verification.connected && verification.tableExists) {
          console.log('Supabase initialized successfully');
          toast.success('Connected to cloud database successfully', { id: 'supabase-init' });
          return true;
        }
        
        // Connected but other issues
        if (verification.connected) {
          console.warn('Connected to Supabase but with issues:', verification.details);
          toast.warning('Limited cloud database connection', { 
            id: 'supabase-init',
            description: 'Some cloud features may not work properly'
          });
          return true; // Return true since we're connected, even with issues
        }
        
        // Not connected at all
        console.error('Failed to connect to Supabase');
        toast.error('Could not connect to cloud database', { 
          id: 'supabase-init',
          description: 'Continuing in offline mode'
        });
        return false;
      } catch (timeoutError) {
        console.error('Supabase connection timed out:', timeoutError);
        lastError = timeoutError as Error;
        toast.error('Cloud database connection timed out', { 
          id: 'supabase-init',
          description: retryCount < MAX_RETRY_ATTEMPTS ? 'Retrying connection...' : 'Continuing in offline mode' 
        });
        return false;
      }
    } catch (error) {
      console.error('Error initializing Supabase:', error);
      lastError = error as Error;
      toast.error('Error connecting to cloud database', {
        id: 'supabase-init',
        description: retryCount < MAX_RETRY_ATTEMPTS ? 'Retrying connection...' : 'Your data will be stored locally only',
      });
      return false;
    }
  };

  // Initial attempt
  let success = await attemptConnection();
  
  // Implement retry with exponential backoff
  while (!success && retryCount < MAX_RETRY_ATTEMPTS) {
    retryCount++;
    const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 6000); // Exponential backoff capped at 6 seconds
    console.log(`Retrying connection in ${backoffTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    success = await attemptConnection();
  }
  
  // Final status notification
  if (!success) {
    console.warn('Supabase connection failed after all retry attempts');
    toast.error('Cloud database connection failed', { 
      id: 'supabase-init',
      description: 'App will run in offline mode. Your data will be stored locally only.',
      duration: 6000,
    });
    
    // Add details to console for debugging
    if (lastError) {
      console.error('Last connection error:', lastError);
    }
  }

  // Always return a status, even if we fail
  return success;
}

// Function to check if Supabase connection is active
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log('Checking Supabase connection status...');
    const supabaseClient = getSupabaseClient();
    
    if (!supabaseClient) {
      console.error('No Supabase client available');
      return false;
    }
    
    // Simple ping request with timeout
    const pingPromise = supabaseClient.from('user_uuids').select('count').limit(1);
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Ping timeout')), 5000);
    });
    
    // Race ping against timeout
    const { data, error } = await Promise.race([pingPromise, timeoutPromise]) as any;
    
    // If we get data or an error about table not existing or policy, we're connected
    const isConnected = Boolean(
      data || 
      (error && (error.message.includes('does not exist') || error.message.includes('policy')))
    );
    
    console.log('Supabase connection check:', isConnected ? 'Connected' : 'Disconnected');
    return isConnected;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

// Function to queue sync operations for retrying later
export const syncQueue = {
  operations: [] as Array<{type: string, payload: any, retryCount: number}>,
  
  add: function(operationType: string, payload: any) {
    this.operations.push({
      type: operationType,
      payload,
      retryCount: 0
    });
    console.log(`Added operation to sync queue: ${operationType}`, payload);
    this.processSoon();
  },
  
  processSoon: function() {
    // Schedule processing of the queue
    setTimeout(() => this.processQueue(), 1000);
  },
  
  processQueue: async function() {
    if (this.operations.length === 0) return;
    
    console.log(`Processing sync queue with ${this.operations.length} operations...`);
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('Cannot process sync queue: offline');
      return;
    }
    
    // Process one operation at a time
    const operation = this.operations[0];
    
    try {
      let success = false;
      
      // Handle different operation types
      if (operation.type === 'syncUuid') {
        const { email, uuid } = operation.payload;
        success = await storeUserUuid(email, uuid);
      }
      // Add more operation types as needed
      
      if (success) {
        // Operation succeeded, remove it from queue
        this.operations.shift();
        console.log('Sync operation completed successfully');
        
        // If we have more operations, continue processing
        if (this.operations.length > 0) {
          this.processSoon();
        }
      } else {
        // Operation failed
        operation.retryCount++;
        
        if (operation.retryCount > 3) {
          // Too many retries, give up on this operation
          console.warn('Giving up on sync operation after multiple retries:', operation);
          this.operations.shift();
        } else {
          // Schedule retry with backoff
          const backoffTime = 2000 * Math.pow(2, operation.retryCount - 1);
          console.log(`Will retry operation in ${backoffTime}ms`);
          setTimeout(() => this.processQueue(), backoffTime);
        }
      }
    } catch (error) {
      console.error('Error processing sync operation:', error);
      // Leave in queue but increment retry count
      operation.retryCount++;
    }
  }
};
