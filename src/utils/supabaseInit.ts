
import { ensureUuidTableExists, getSupabaseClient, storeUserUuid } from './supabase/index';
import { verifySupabaseSetup, attemptSupabaseSetupFix } from './supabaseVerification';
import { toast } from 'sonner';

const CONNECTION_TIMEOUT = 15000; // 15 seconds timeout

// Initialize Supabase and verify connection
export async function initializeSupabase(): Promise<boolean> {
  try {
    console.log('Initializing Supabase connection...');
    toast.loading('Connecting to cloud database...', { id: 'supabase-init' });
    
    // Get the initialized client
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.error('Failed to initialize Supabase client');
      toast.error('Supabase connection failed', { id: 'supabase-init' });
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
        return false;
      }
      
      // Not connected at all
      console.error('Failed to connect to Supabase');
      toast.error('Could not connect to cloud database', { 
        id: 'supabase-init',
        description: 'Your data will be stored locally only'
      });
      return false;
    } catch (timeoutError) {
      console.error('Supabase connection timed out:', timeoutError);
      toast.error('Cloud database connection timed out', { 
        id: 'supabase-init',
        description: 'Continuing in offline mode' 
      });
      return false;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    toast.error('Error connecting to cloud database', {
      id: 'supabase-init',
      description: 'Your data will be stored locally only',
      duration: 5000,
    });
    return false;
  }
}
