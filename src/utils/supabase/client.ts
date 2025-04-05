
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
    
  // Return true if any of the checks indicate an RLS policy error
  return isPermissionDenied || hasRlsKeywords;
};

// Improved and simplified function to check if we have a database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    console.log('Checking Supabase connection...');
    
    // First attempt: Try to query the user_uuids table
    try {
      const { data, error } = await supabaseClient
        .from('user_uuids')
        .select('count')
        .limit(1);
      
      // If successful or we get an RLS policy error, we're connected
      if (!error || isRlsPolicyError(error)) {
        const duration = Date.now() - start;
        console.log(`Database connection successful in ${duration}ms`);
        return true;
      }
      
      // Table might not exist (code 42P01), continue to other checks
      if (error.code !== '42P01') {
        console.error('Database connection error:', error);
      }
    } catch (e) {
      console.warn('First connection check failed:', e);
    }
    
    // Second attempt: Try the version RPC
    try {
      const { data, error } = await supabaseClient.rpc('version');
      
      if (!error) {
        const duration = Date.now() - start;
        console.log(`Database connection successful via version check in ${duration}ms`);
        return true;
      }
    } catch (e) {
      console.warn('Version check failed:', e);
    }
    
    // Third attempt: Try a schema health check
    try {
      const { data, error } = await supabaseClient
        .from('_anon_schema_check')
        .select('*')
        .limit(1);
        
      // This will likely fail, but if we get a 42P01 error or RLS error, 
      // it means we are connected
      if (error && (error.code === '42P01' || isRlsPolicyError(error))) {
        const duration = Date.now() - start;
        console.log(`Database connection confirmed via schema check in ${duration}ms`);
        return true;
      }
    } catch (e) {
      console.warn('Schema check failed:', e);
    }
    
    // Fourth attempt: Try a simple auth check
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (!error) {
        const duration = Date.now() - start;
        console.log(`Database connection confirmed via auth check in ${duration}ms`);
        return true;
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
    }
    
    // All checks failed
    console.error('All database connection attempts failed');
    return false;
  } catch (err) {
    console.error('Database connection exception:', err);
    return false;
  }
};
