
import { getSupabaseClient } from './supabase/client';
import { checkTableExists, ensureUuidTableExists } from './supabase/tableManagement';
import { ensureGrowTablesExist } from './supabase/growTableSetup';

export const initializeSupabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing Supabase connection...');
    const supabase = getSupabaseClient();
    
    // First check that we can connect
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn('Failed to connect to Supabase');
      return false;
    }
    
    console.log('Connected to Supabase, ensuring tables exist...');
    
    // Ensure user_uuids table exists
    await ensureUuidTableExists();
    
    // Ensure grow tables exist
    await ensureGrowTablesExist();
    
    console.log('Supabase initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
};

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      // We expect PGRST116 (relation does not exist) as we're querying a non-existent table
      // If we get any other error, there might be a connection issue
      console.error('Connection test failed with error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Connection test failed with exception:', error);
    return false;
  }
};
