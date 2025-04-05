
import { createClient } from '@supabase/supabase-js';

// Store Supabase credentials directly in the code
// These are safe to store in the frontend code as they are public anon keys
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

// Create a single Supabase client instance for use throughout the app
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // Increase timeout for better reliability on slow connections
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      return fetch(url, { 
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

// Export the client directly to avoid creating multiple instances
export const getSupabaseClient = () => supabaseClient;

// Enhanced function to check if this is a RLS policy error with more specific detection
export const isRlsPolicyError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for specific PostgreSQL permission denied code
  const isPermissionDenied = error.code === '42501';
  
  // Check error message for RLS policy violation keywords
  const messageIncludes = (str: string) => 
    error.message?.toLowerCase().includes(str.toLowerCase());
    
  const hasRlsKeywords = 
    messageIncludes('policy') || 
    messageIncludes('violates row-level security') ||
    messageIncludes('permission denied') ||
    messageIncludes('rls') ||
    messageIncludes('permission'); // Added for broader detection
    
  // Check error details for similar keywords
  const detailsInclude = (str: string) =>
    error.details?.toLowerCase().includes(str.toLowerCase());
    
  const detailsHaveRlsKeywords =
    detailsInclude('policy') ||
    detailsInclude('rls') ||
    detailsInclude('permission');
  
  // Log detailed information for debugging
  if (isPermissionDenied || hasRlsKeywords || detailsHaveRlsKeywords) {
    console.warn('RLS policy error detected:', error);
  }
  
  // Return true if any of the checks indicate an RLS policy error
  return isPermissionDenied || hasRlsKeywords || detailsHaveRlsKeywords;
};

// Improved function to check if we have a database connection with more reliable verification
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    console.log('Checking Supabase connection...');
    
    // Try multiple database checks with fallbacks
    // First try to query the user_uuids table which should exist in most installations
    const { data: userData, error: userError } = await supabaseClient
      .from('user_uuids')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    // If we get an RLS policy error, the connection is still working
    if (userError && isRlsPolicyError(userError)) {
      const duration = Date.now() - start;
      console.log(`Database connection successful (RLS policies detected) in ${duration}ms`);
      return true;
    }
    
    // If not a policy error but another error, try a fallback approach
    if (userError && userError.code === '42P01') { // Table doesn't exist error
      console.log('user_uuids table does not exist, checking alternative tables...');
      
      // Try to check if we can access version information which doesn't require table access
      try {
        const { data, error: versionError } = await supabaseClient.rpc('version');
        
        if (!versionError) {
          const duration = Date.now() - start;
          console.log(`Database connection successful via version check in ${duration}ms`);
          return true;
        }
      } catch (versionErr) {
        console.warn('Version check failed:', versionErr);
      }
      
      // Last resort - try to access public schema information
      try {
        const { data, error: schemaError } = await supabaseClient
          .from('_anon_schema_check')
          .select('*')
          .limit(1);
          
        // This will likely fail but the error type tells us if we're connected  
        if (schemaError && (schemaError.code === '42P01' || isRlsPolicyError(schemaError))) {
          const duration = Date.now() - start;
          console.log(`Database connection confirmed via schema check in ${duration}ms`);
          return true;
        }
      } catch (schemaErr) {
        // Even this error might indicate we're connected
        const duration = Date.now() - start;
        console.log(`Database connection likely active in ${duration}ms despite errors`);
        return true; // Assume connected if we got a response
      }
    }
    
    // No errors means we successfully connected
    if (!userError) {
      const duration = Date.now() - start;
      console.log(`Database connection successful in ${duration}ms`);
      return true;
    }
    
    // If we reach here, all connection attempts failed
    console.error('All database connection attempts failed');
    return false;
  } catch (err) {
    console.error('Database connection exception:', err);
    return false;
  }
};
