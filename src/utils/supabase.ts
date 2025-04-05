
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for required environment variables
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('Missing or invalid VITE_SUPABASE_URL environment variable');
  toast.error('Supabase URL is missing. Please check your environment variables.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Missing or invalid VITE_SUPABASE_ANON_KEY environment variable');
  toast.error('Supabase key is missing. Please check your environment variables.');
}

// Create Supabase client (no fallbacks - we want to fail early if config is missing)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table name for user UUIDs
export const UUID_TABLE = 'user_uuids';

// Check if the user_uuids table exists, and create it if it doesn't
export async function ensureUuidTableExists(): Promise<boolean> {
  try {
    // First check if the table exists by trying to query it
    const { error } = await supabase
      .from(UUID_TABLE)
      .select('id')
      .limit(1);
    
    if (!error) {
      // Table exists, we're good to go
      return true;
    }
    
    // If the error is not a "relation does not exist" error, something else is wrong
    if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
      console.error('Error checking UUID table:', error);
      return false;
    }
    
    // Table doesn't exist, let's try to create it through SQL
    // Note: This requires additional permissions that may not be available with the anon key
    const { error: createError } = await supabase.rpc('create_user_uuids_table');
    
    if (createError) {
      console.error('Error creating UUID table:', createError);
      toast.error('Could not create the required database table. Please contact support.');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error ensuring UUID table exists:', err);
    return false;
  }
}

// Functions for UUID management in Supabase
export async function fetchUserUuid(email: string): Promise<string | null> {
  if (!email) {
    console.error('No email provided to fetch UUID');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from(UUID_TABLE)
      .select('uuid')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching UUID:', error);
      return null;
    }

    return data?.uuid || null;
  } catch (err) {
    console.error('Exception fetching UUID:', err);
    return null;
  }
}

export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  if (!email || !uuid) {
    console.error('Missing email or UUID for storage');
    return false;
  }
  
  try {
    // Check if entry already exists
    const { data: existingData, error: fetchError } = await supabase
      .from(UUID_TABLE)
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError && !fetchError.message.includes('No rows found')) {
      console.error('Error checking for existing UUID:', fetchError);
      toast.error('Failed to check if user already exists');
      return false;
    }

    let success = false;
    
    if (existingData) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from(UUID_TABLE)
        .update({ uuid })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating UUID:', updateError);
        toast.error('Failed to update your ID');
        return false;
      }
      success = true;
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from(UUID_TABLE)
        .insert([{ email, uuid }]);

      if (insertError) {
        console.error('Error storing UUID:', insertError);
        toast.error('Failed to store your ID');
        return false;
      }
      success = true;
    }

    if (success) {
      console.log('UUID successfully stored for', email);
    }
    
    return success;
  } catch (err) {
    console.error('Exception storing UUID:', err);
    toast.error('An unexpected error occurred');
    return false;
  }
}
