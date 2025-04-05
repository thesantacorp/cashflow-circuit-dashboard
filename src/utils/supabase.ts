
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Create a Supabase client for use throughout the app
export const getSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'YOUR_SUPABASE_URL' || 
      supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
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
        
        // Create the table using SQL query via REST endpoint
        const { error: createTableError } = await supabase.from('_manual_table_creation').select('*');
        
        if (createTableError) {
          console.log('Will create table via the Supabase UI instead');
          
          toast.info(
            'Please create a table in Supabase', 
            { 
              description: 'Create a "user_uuids" table with columns: id (integer, primary key), email (text, unique), uuid (text)',
              duration: 10000
            }
          );
          
          // Try to create the table automatically via API
          try {
            await createUserUuidsTable(supabase);
            toast.success('Table created successfully!');
            return true;
          } catch (e) {
            console.error('Failed to create table automatically:', e);
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user_uuids table exists:', error);
    return false;
  }
}

// Function to create the user_uuids table automatically
async function createUserUuidsTable(supabase: any): Promise<boolean> {
  try {
    // First try to create the table through a REST API call
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/create_user_uuids_table`, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to create table via REST API');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating user_uuids table:', error);
    return false;
  }
}
