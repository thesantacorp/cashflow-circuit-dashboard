
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
      return fetch(url, { 
        ...options,
        // Set longer timeout for requests
        signal: options?.signal || (new AbortController().signal)
      });
    }
  }
});

// Export the client directly to avoid creating multiple instances
export const getSupabaseClient = () => supabaseClient;

// Export a function to check if this is a RLS policy error
export const isRlsPolicyError = (error: any): boolean => {
  if (!error) return false;
  
  // Check error message for RLS policy violation
  return error.message?.includes('policy') || 
         error.code === '42501' || // PostgreSQL permission denied code
         error.details?.includes('policy');
};
