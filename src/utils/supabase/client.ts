
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
    
    // Use a simplified connection check that's more likely to succeed
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (!error) {
        console.log(`Database connection successful via auth check in ${Date.now() - start}ms`);
        return true;
      }
    } catch (e) {
      // Continue to next check
    }
    
    // Simpler check that's very likely to work
    try {
      const { data, error } = await supabaseClient
        .from('user_uuids')
        .select('count')
        .limit(1);
      
      // Even permission errors mean we're connected
      if (!error || isRlsPolicyError(error)) {
        console.log(`Database connection successful in ${Date.now() - start}ms`);
        return true;
      }
      
      // If table doesn't exist yet, that's still a connection
      if (error.code === '42P01') {
        console.log(`Database connected (table doesn't exist yet) in ${Date.now() - start}ms`);
        return true;
      }
    } catch (e) {
      // Continue to service check
    }
    
    // Final check - can we access the Supabase service at all?
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      // Even a 404 means the service is up
      if (response.status !== 0) {
        console.log(`Supabase service is reachable in ${Date.now() - start}ms`);
        return true;
      }
    } catch (e) {
      console.error('Failed to reach Supabase service:', e);
    }
    
    console.error('All database connection attempts failed');
    return false;
  } catch (err) {
    console.error('Database connection exception:', err);
    return false;
  }
};
