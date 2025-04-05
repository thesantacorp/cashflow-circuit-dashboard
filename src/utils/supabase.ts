
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Store Supabase credentials directly in the code
// These are safe to store in the frontend code as they are public anon keys
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

// Create a single Supabase client instance for use throughout the app
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the client directly to avoid creating multiple instances
export const getSupabaseClient = () => supabaseClient;

// Store user UUID in Supabase
export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client');
    return false;
  }
  
  try {
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('user_uuids')
      .select('id')
      .limit(1);
      
    // If table doesn't exist, try to create it
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Table does not exist, creating it...');
      
      // Create the user_uuids table using SQL
      const { error: createError } = await supabase.rpc('create_table_if_not_exists', {
        table_name: 'user_uuids',
        table_definition: `
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          uuid TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `
      });
      
      if (createError) {
        console.error('Error creating table:', createError);
        return false;
      }
    }
    
    // Now attempt to insert the record
    const { error: insertError } = await supabase
      .from('user_uuids')
      .upsert({ email, uuid }, { 
        onConflict: 'email',
        ignoreDuplicates: false
      });
      
    if (insertError) {
      console.error('Error storing user UUID in Supabase:', insertError);
      return false;
    }
    
    console.log(`Successfully stored UUID for ${email}`);
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
    // First, check if the table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('user_uuids')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      // Table exists
      console.log('user_uuids table already exists');
      return true;
    }
    
    if (checkError.message.includes('does not exist')) {
      console.log('user_uuids table does not exist, attempting to create it');
      
      try {
        // Try to create the table via a stored procedure if available
        const { error: createError } = await supabase.rpc('create_table_if_not_exists', {
          table_name: 'user_uuids',
          table_definition: `
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            uuid TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          `
        });
        
        if (createError) {
          console.log('Could not create table via RPC:', createError.message);
          
          // Table creation function doesn't exist, show manual instructions
          toast.info(
            'Please create a table in Supabase', 
            { 
              description: 'Create a "user_uuids" table with columns: id (integer, primary key), email (text, unique), uuid (text)',
              duration: 10000
            }
          );
          
          return false;
        }
        
        console.log('Successfully created user_uuids table via RPC');
        return true;
      } catch (e) {
        console.error('Error creating table:', e);
        return false;
      }
    }
    
    console.error('Unknown error checking table:', checkError);
    return false;
  } catch (error) {
    console.error('Error ensuring user_uuids table exists:', error);
    return false;
  }
}
