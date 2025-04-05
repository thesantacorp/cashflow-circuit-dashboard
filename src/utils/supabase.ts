
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
  
  try {
    // First make sure the table exists
    await ensureUuidTableExists();
    
    // Now attempt to insert the record using SQL directly for more reliability
    const { error: insertError } = await supabase
      .from('user_uuids')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        uuid: uuid 
      });
      
    if (insertError) {
      console.error('Error storing user UUID in Supabase:', insertError);
      
      // Try a direct SQL approach if the first method failed
      const { error: sqlError } = await supabase.rpc('insert_user_uuid', {
        p_email: email.toLowerCase().trim(),
        p_uuid: uuid
      });
      
      if (sqlError) {
        console.error('Error with SQL approach:', sqlError);
        return false;
      }
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
  
  try {
    // Make sure we normalize the email
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('user_uuids')
      .select('uuid')
      .eq('email', normalizedEmail)
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
  
  try {
    // First, try to create the table directly using SQL
    const { error: createTableError } = await supabase.rpc('create_uuid_table');
    
    // Regardless of error (might already exist), try to query the table
    const { error: checkError } = await supabase
      .from('user_uuids')
      .select('count(*)')
      .limit(1);
    
    // If we can query it successfully, it exists
    if (!checkError) {
      console.log('user_uuids table exists and is accessible');
      return true;
    }
    
    // If there's an error but it's not "table doesn't exist", it's another issue
    if (!checkError.message.includes('does not exist')) {
      console.error('Error checking user_uuids table:', checkError);
      return false;
    }
    
    // If table doesn't exist, try creating it with raw SQL
    console.log('user_uuids table does not exist, trying to create with raw SQL');
    
    const { error: rawSqlError } = await supabase.rpc('execute_sql', {
      sql_string: `
        CREATE TABLE IF NOT EXISTS user_uuids (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          uuid TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (rawSqlError) {
      console.error('Error creating table with raw SQL:', rawSqlError);
      
      // Show manual instruction to the user
      toast.info(
        'Please create a table in Supabase', 
        { 
          description: 'Create a "user_uuids" table with columns: id (integer, primary key), email (text, unique), uuid (text)',
          duration: 10000
        }
      );
      return false;
    }
    
    // Verify the table was created
    const { error: verifyError } = await supabase
      .from('user_uuids')
      .select('count(*)')
      .limit(1);
    
    if (verifyError) {
      console.error('Table creation verification failed:', verifyError);
      return false;
    }
    
    console.log('Successfully created user_uuids table');
    return true;
  } catch (error) {
    console.error('Error ensuring user_uuids table exists:', error);
    return false;
  }
}
