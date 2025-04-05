
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Check for valid Supabase URL and key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xejnmpsmnakewioiflcj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlam5tcHNtbmFrZXdpb2lmbGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODM3MzA5NjYsImV4cCI6MTk5OTMwNjk2Nn0.R7JQITqV4ODsanBkyaKzeMpWh7cXGZMG7SSLWa8VuXw';

let supabaseClient: any = null;

// Function to get or create the Supabase client
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          fetch: (...args) => {
            // Add retry logic and proper error handling
            return fetch(...args).catch(error => {
              console.error('Fetch error in Supabase client:', error);
              throw new Error(`Network error: ${error.message || 'Failed to connect to Supabase'}`);
            });
          },
        },
      });
      
      console.log('Supabase client created successfully');
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      toast.error('Failed to initialize database connection', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return supabaseClient;
};

// Check if an error is a Row Level Security policy error
export const isRlsPolicyError = (error: any) => {
  if (!error) return false;
  
  // Check common RLS error patterns
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  
  return (
    errorCode === '42501' || 
    errorMessage.includes('permission denied') ||
    errorMessage.includes('RLS') || 
    errorMessage.includes('policy') ||
    errorMessage.includes('row level security')
  );
};

// Check if the database connection is working
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    
    console.log('Checking Supabase connection...');
    
    // Try a simple query to see if we can connect
    const { data, error, status } = await supabase
      .from('user_uuids')
      .select('count(*)', { count: 'exact', head: true })
      .limit(1)
      .timeout(5000);
      
    // Handle specific error types
    if (error) {
      console.error('Database connection check error:', error);
      
      // If it's a content-type error, log specifically
      if (error.message.includes('Content-Type')) {
        console.error('Content-Type error detected in database connection');
        toast.error('Database connection error', { 
          description: 'Content-Type issue detected. This is often a temporary problem.',
          duration: 8000
        });
      }
      
      // If it's an RLS error, that actually means we connected
      if (isRlsPolicyError(error)) {
        console.log('RLS error during connection check, but connection succeeded');
        return true;
      }
      
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Exception during database connection check:', error);
    
    // More specific error feedback
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('fetch')) {
        toast.error('Network error connecting to database', {
          description: 'Please check your internet connection'
        });
      } else if (msg.includes('Content-Type')) {
        toast.error('Content-Type error with database', {
          description: 'This is often temporary. Please try again in a moment.'
        });
      } else {
        toast.error('Database connection failed', {
          description: msg
        });
      }
    }
    
    return false;
  }
};
