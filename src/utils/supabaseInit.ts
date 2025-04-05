
import { ensureUuidTableExists, getSupabaseClient } from './supabase';
import { toast } from 'sonner';

// Initialize Supabase and verify connection
export async function initializeSupabase(): Promise<void> {
  try {
    console.log('Initializing Supabase connection...');
    
    // Check if the initialized client is working
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      toast.error(
        'Supabase configuration is missing or invalid',
        { 
          description: 'Please check your Supabase credentials',
          duration: 10000
        }
      );
      console.error('Failed to initialize Supabase client');
      return;
    }
    
    // Test the connection with a simple health check
    const { data, error } = await supabaseClient.from('_health_check').select('*').maybeSingle();
    
    // If there's an auth error, it's a credentials issue
    if (error && error.message.includes('JWT')) {
      console.error('Authentication error with Supabase:', error);
      toast.error(
        'Supabase authentication error',
        { 
          description: 'Please check your Supabase API key',
          duration: 6000
        }
      );
      return;
    }
    
    // If there's a "not found" error, that's actually good - it means connection works
    // but the _health_check table doesn't exist (which is expected)
    if (error && !error.message.includes('JWT')) {
      console.log('Supabase connection established successfully');
    }
    
    // Now let's try to setup or verify the user_uuids table
    console.log('Supabase connection successful, checking UUID table...');
    
    // Make three attempts to ensure table exists
    let tableExists = false;
    let attempts = 0;
    while (!tableExists && attempts < 3) {
      attempts++;
      console.log(`Attempt ${attempts} to verify/create user_uuids table...`);
      tableExists = await ensureUuidTableExists();
      
      if (!tableExists && attempts < 3) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (tableExists) {
      console.log('Supabase UUID table is ready');
      toast.success('Connected to Supabase successfully');
    } else {
      console.warn('Could not automatically create the UUID table');
      toast.warning(
        'Table setup may be needed',
        { 
          description: 'Please run this SQL in your Supabase SQL editor: CREATE TABLE IF NOT EXISTS user_uuids (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, uuid TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);',
          duration: 15000
        }
      );
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
  }
}
