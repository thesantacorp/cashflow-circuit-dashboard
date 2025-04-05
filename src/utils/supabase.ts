
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
    console.log(`Attempting to store UUID ${uuid} for email ${email} in Supabase...`);
    
    // First make sure the table exists
    await ensureUuidTableExists();
    
    // Insert the record
    const { error } = await supabase
      .from('user_uuids')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        uuid: uuid 
      }, { onConflict: 'email' });
      
    if (error) {
      console.error('Error storing user UUID in Supabase:', error);
      
      // Try a direct insert as fallback
      const { error: insertError } = await supabase
        .from('user_uuids')
        .insert([
          { email: email.toLowerCase().trim(), uuid: uuid }
        ]);
        
      if (insertError) {
        console.error('Direct insert failed:', insertError);
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
    console.log(`Attempting to fetch UUID for email ${normalizedEmail} from Supabase...`);
    
    const { data, error } = await supabase
      .from('user_uuids')
      .select('uuid')
      .eq('email', normalizedEmail)
      .single();
      
    if (error) {
      console.error('Error fetching user UUID from Supabase:', error);
      return null;
    }
    
    console.log(`Retrieved UUID for ${normalizedEmail}:`, data?.uuid);
    return data?.uuid || null;
  } catch (error) {
    console.error('Exception when fetching user UUID from Supabase:', error);
    return null;
  }
}

// Verify if a UUID exists in Supabase
export async function verifyUuidInSupabase(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Verifying UUID ${uuid} for ${normalizedEmail} in Supabase...`);
    
    // Check if the table exists
    const tableExists = await checkTableExists('user_uuids');
    if (!tableExists) {
      console.log('user_uuids table does not exist in Supabase');
      return false;
    }
    
    // Query for the specific UUID
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('uuid', uuid);
      
    if (error) {
      console.error('Error verifying UUID in Supabase:', error);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log(`UUID verification result for ${normalizedEmail}: ${exists ? 'Found' : 'Not found'}`);
    return exists;
  } catch (error) {
    console.error('Exception when verifying UUID in Supabase:', error);
    return false;
  }
}

// Get all stored UUIDs (for admin/verification purposes)
export async function getAllUuids(): Promise<any[] | null> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Fetching all UUIDs from Supabase...');
    
    // Check if the table exists first
    const tableExists = await checkTableExists('user_uuids');
    if (!tableExists) {
      console.log('user_uuids table does not exist in Supabase');
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching all UUIDs from Supabase:', error);
      return null;
    }
    
    console.log(`Retrieved ${data?.length || 0} UUIDs from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Exception when fetching all UUIDs from Supabase:', error);
    return null;
  }
}

// Helper to check if a table exists in Supabase
export async function checkTableExists(tableName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Checking if ${tableName} table exists...`);
    
    // Try to select a single row from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // If no error, table exists
    const exists = !error;
    console.log(`Table ${tableName} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error(`Error checking if ${tableName} table exists:`, error);
    return false;
  }
}

// Check if the user_uuids table exists, create it if it doesn't
export async function ensureUuidTableExists(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Ensuring user_uuids table exists...');
    
    // First check if the table exists
    const tableExists = await checkTableExists('user_uuids');
    
    // If table exists, return true
    if (tableExists) {
      console.log('user_uuids table exists and is accessible');
      return true;
    }
    
    // Define a SQL script to create the table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_uuids (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        uuid TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Creating user_uuids table with SQL:', createTableSQL);
    
    // Try direct SQL execution with rpc (if function is available)
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (sqlError) {
        console.error('Error executing SQL via RPC:', sqlError);
        throw new Error('RPC failed');
      }
    } catch (rpcError) {
      console.warn('RPC method failed, trying alternative approach:', rpcError);
      
      // Try creating the table via REST API (this is a backup approach)
      const { error: restError } = await supabase
        .from('user_uuids')
        .insert({ 
          email: 'system_test@example.com',
          uuid: 'test-uuid-for-table-creation'
        });
      
      // If error is not about table not existing, we have a different problem
      if (restError && !restError.message.includes('relation') && !restError.message.includes('does not exist')) {
        console.error('Error creating table via REST:', restError);
        return false;
      }
    }
    
    // Verify the table exists now
    const verifyExists = await checkTableExists('user_uuids');
    
    if (!verifyExists) {
      console.error('Table creation failed or verification failed');
      
      // Show instruction for manual table creation
      toast.error(
        'Could not automatically create the user_uuids table', 
        {
          description: 'Please create it manually in your Supabase project',
          duration: 10000
        }
      );
      
      return false;
    }
    
    console.log('Successfully created or verified user_uuids table');
    return true;
  } catch (error) {
    console.error('Exception ensuring user_uuids table exists:', error);
    return false;
  }
}
