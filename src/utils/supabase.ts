
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Store Supabase credentials directly in the code
// These are safe to store in the frontend code as they are public anon keys
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

// Create a Supabase client for use throughout the app
export const getSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing or invalid Supabase environment variables');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Store user UUID in Supabase
export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('user_uuids')
      .upsert({ email, uuid }, { onConflict: 'email' });
      
    if (error) {
      console.error('Error storing user UUID in Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception when storing user UUID in Supabase:', error);
    return false;
  }
}

// Fetch user UUID from Supabase
export async function fetchUserUuid(email: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_uuids')
      .select('uuid')
      .eq('email', email)
      .single();
      
    if (error) {
      console.error('Error fetching user UUID from Supabase:', error);
      return null;
    }
    
    return data?.uuid || null;
  } catch (error) {
    console.error('Exception when fetching user UUID from Supabase:', error);
    return null;
  }
}

// Check if the user_uuids table exists, create it if it doesn't
export async function ensureUuidTableExists(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client');
    return false;
  }
  
  try {
    // Try to create the table via function call
    const { error: createError } = await supabase.rpc('create_user_uuids_table_if_not_exists');
    
    if (createError) {
      console.log('Could not create table via RPC, will check if it exists:', createError.message);
      
      // Check if the table exists by trying to select from it
      const { error: checkError } = await supabase
        .from('user_uuids')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist, provide instructions to create it manually
      if (checkError) {
        console.log('user_uuids table does not exist yet, providing instructions to create it');
        
        toast.info(
          'Table setup required', 
          { 
            description: 'Creating the user_uuids table in your Supabase project...',
            duration: 5000
          }
        );

        // Try to create the table with a direct SQL query through REST
        try {
          const { error } = await supabase
            .from('user_uuids')
            .insert([])
            .select();

          if (error && error.message.includes("does not exist")) {
            console.log("Table doesn't exist, attempting to create it");

            // If this approach fails, show manual instructions
            toast.info(
              'Please create a table in Supabase', 
              { 
                description: 'Create a "user_uuids" table with columns: id (integer, primary key), email (text, unique), uuid (text)',
                duration: 10000
              }
            );
          }
        } catch (e) {
          console.error('Failed to check or create table:', e);
        }
        
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user_uuids table exists:', error);
    return false;
  }
}
