
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

// Function to check if we have a database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    const { data, error } = await supabaseClient.from('user_uuids').select('count').limit(1).maybeSingle();
    const duration = Date.now() - start;
    
    console.log(`Database connection check completed in ${duration}ms`);
    
    // If we get an RLS policy error, the connection is still working
    // but the policies are blocking access
    if (error && isRlsPolicyError(error)) {
      console.log('Database connection successful (RLS policies detected)');
      return true;
    }
    
    // If we get any other error, the connection might be down
    if (error && !isRlsPolicyError(error)) {
      console.error('Database connection error:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Database connection exception:', err);
    return false;
  }
};
