
import { ensureUuidTableExists, getSupabaseClient, storeUserUuid } from './supabase';
import { toast } from 'sonner';

// Initialize Supabase and verify connection
export async function initializeSupabase(): Promise<boolean> {
  try {
    console.log('Initializing Supabase connection...');
    
    // Get the initialized client
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.error('Failed to initialize Supabase client');
      toast.error('Supabase connection failed');
      return false;
    }
    
    // Test the connection with a simple health check
    try {
      const { error } = await supabaseClient.from('_health_check').select('*').maybeSingle();
      
      // If there's an auth error, it's a credentials issue
      if (error && error.message.includes('JWT')) {
        console.error('Authentication error with Supabase:', error);
        toast.error('Supabase authentication error');
        return false;
      }
      
      // If there's a "not found" error, that's actually good - it means connection works
      // but the _health_check table doesn't exist (which is expected)
      console.log('Supabase connection test result:', error ? 'Table not found (expected)' : 'Success');
    } catch (healthCheckError) {
      // Log but continue - this might still work
      console.warn('Health check failed but continuing:', healthCheckError);
    }
    
    // Try to ensure the user_uuids table exists
    console.log('Checking for user_uuids table...');
    
    // Make three attempts to ensure table exists
    let tableExists = false;
    let attempts = 0;
    
    while (!tableExists && attempts < 3) {
      attempts++;
      console.log(`Attempt ${attempts}/3 to verify/create user_uuids table...`);
      
      try {
        tableExists = await ensureUuidTableExists();
      } catch (tableError) {
        console.error(`Error on attempt ${attempts}:`, tableError);
      }
      
      if (!tableExists && attempts < 3) {
        console.log(`Waiting before retry ${attempts + 1}...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (tableExists) {
      console.log('Supabase UUID table is ready');
      toast.success('Successfully connected to Supabase');
      return true;
    } else {
      console.warn('Could not automatically create the UUID table');
      
      // Check if we can at least access Supabase
      try {
        const { data, error } = await supabaseClient.from('user_uuids').select('count').maybeSingle();
        
        if (!error) {
          toast.success('Connected to Supabase successfully', {
            description: 'The user_uuids table already exists',
          });
          return true;
        }
      } catch (e) {
        // Ignore error and continue with the warning
      }
      
      toast.warning(
        'Connected, but table setup may be needed',
        { 
          description: 'Please run this SQL in your Supabase SQL editor: CREATE TABLE IF NOT EXISTS user_uuids (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, uuid TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);',
          duration: 15000
        }
      );
      
      return false;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    toast.error(
      'Error connecting to Supabase',
      { 
        description: 'Please check your credentials and try again',
        duration: 6000
      }
    );
    return false;
  }
}
