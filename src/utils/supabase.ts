
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
    // First, check if the table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('user_uuids')
      .select('id')
      .limit(1);
    
    // If the table doesn't exist, we'll get an error
    if (checkError) {
      console.log('user_uuids table may not exist, attempting to create it');
      
      // Use RPC to create the table (using raw SQL is not available through the JS client)
      // We'll create a custom RPC function in Supabase that creates the table
      
      // Since we can't execute raw SQL directly, we'll provide instructions to the user
      console.warn('Please create a "user_uuids" table in your Supabase dashboard with the following columns:');
      console.warn('- id (integer, primary key, auto-increment)');
      console.warn('- email (text, unique)');
      console.warn('- uuid (text)');
      
      toast.info(
        'Table setup required', 
        { 
          description: 'Please create a "user_uuids" table in your Supabase dashboard.',
          duration: 10000
        }
      );
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking if user_uuids table exists:', error);
    return false;
  }
}
