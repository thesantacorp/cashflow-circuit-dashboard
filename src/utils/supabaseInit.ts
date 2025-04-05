
import { ensureUuidTableExists, getSupabaseClient } from './supabase';
import { toast } from 'sonner';

// Store Supabase credentials directly in the code
// These are safe to store in the frontend code as they are public anon keys
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

export async function initializeSupabase(): Promise<void> {
  try {
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
    
    // Verify the connection with a simple query
    const { error: connectionError } = await supabaseClient.from('user_uuids').select('count').limit(1).single();
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      console.error('Error connecting to Supabase:', connectionError);
      toast.error(
        'Error connecting to Supabase',
        { 
          description: 'Please check your network connection and try again',
          duration: 6000
        }
      );
      return;
    }
    
    // Check if the UUID table exists, create it if it doesn't
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
