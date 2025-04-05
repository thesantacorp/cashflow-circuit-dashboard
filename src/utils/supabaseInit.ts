
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
    
    // Test the connection with a simple query first
    const { data: testData, error: testError } = await supabaseClient.from('_test_connection_').select('*').limit(1).single();
    
    // This query is expected to fail with "relation does not exist" error
    // But that confirms the connection works and gets a response from the server
    if (testError && !testError.message.includes('does not exist')) {
      if (testError.message.includes('JWT')) {
        console.error('Authentication error with Supabase:', testError);
        toast.error(
          'Supabase authentication error',
          { 
            description: 'Please check your Supabase API key',
            duration: 6000
          }
        );
        return;
      }
      
      // If it's another kind of error not related to table existence
      if (!testError.message.includes('does not exist')) {
        console.error('Error connecting to Supabase:', testError);
        toast.error(
          'Error connecting to Supabase',
          { 
            description: 'Please check your network connection',
            duration: 6000
          }
        );
        return;
      }
    }
    
    // Connection seems to work, let's ensure the UUID table exists
    console.log('Supabase connection successful, checking UUID table...');
    const tableExists = await ensureUuidTableExists();
    
    if (tableExists) {
      console.log('Supabase UUID table is ready');
      toast.success('Connected to Supabase successfully');
    } else {
      console.warn('Could not automatically create the UUID table');
      toast.warning(
        'Table setup may be needed',
        { 
          description: 'Please ensure the user_uuids table exists in your Supabase project',
          duration: 8000
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
