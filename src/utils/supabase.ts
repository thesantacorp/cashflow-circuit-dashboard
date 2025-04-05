
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
    
    // Insert the record using upsert
    const { error: insertError } = await supabase
      .from('user_uuids')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        uuid: uuid 
      });
      
    if (insertError) {
      console.error('Error storing user UUID in Supabase:', insertError);
      
      // Try inserting with a direct RPC call as fallback
      try {
        const { error: directError } = await supabase
          .from('user_uuids')
          .insert([
            { email: email.toLowerCase().trim(), uuid: uuid }
          ]);
          
        if (directError) {
          console.error('Direct insert failed:', directError);
          return false;
        }
      } catch (directInsertError) {
        console.error('Exception during direct insert:', directInsertError);
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
    // First check if the table exists by attempting to query a single row
    const { error: checkError } = await supabase
      .from('user_uuids')
      .select('id') // Select a specific column, not count(*)
      .limit(1);
    
    // If no error, table exists
    if (!checkError) {
      console.log('user_uuids table exists and is accessible');
      return true;
    }
    
    // If there's an error but it's not "table doesn't exist", it might be another issue
    if (!checkError.message.includes('does not exist')) {
      console.error('Error checking user_uuids table:', checkError);
      // The table might still exist but have a different issue
      return false;
    }
    
    console.log('Creating user_uuids table...');
    
    // Execute SQL to create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_uuids (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          uuid TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (createError) {
      console.error('Error creating table with exec_sql:', createError);
      
      // Try alternative approach with simple SQL statement
      const { error: sqlError } = await supabase.rpc('create_user_uuids_table');
      
      if (sqlError) {
        console.error('Alternative table creation failed:', sqlError);
        
        // If both methods fail, show manual instruction
        toast.info(
          'Database setup required',
          {
            description: 'Please create a "user_uuids" table in your Supabase project with columns: id (serial), email (text), uuid (text)',
            duration: 10000
          }
        );
        
        return false;
      }
    }
    
    // Verify table was created successfully
    const { error: verifyError } = await supabase
      .from('user_uuids')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.error('Table creation verification failed:', verifyError);
      return false;
    }
    
    console.log('Successfully created user_uuids table');
    return true;
  } catch (error) {
    console.error('Exception ensuring user_uuids table exists:', error);
    return false;
  }
}
