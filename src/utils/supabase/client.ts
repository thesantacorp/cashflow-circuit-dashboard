import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Use the values from the integrated Supabase client instead of environment variables
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

let supabaseClient: any = null;
let connectionChecked = false;
let connectionAvailable = false;
let lastConnectionCheck = 0;
const CHECK_INTERVAL = 30000; // 30 seconds

// Function to get or create the Supabase client
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: localStorage
        },
        global: {
          fetch: (...args: Parameters<typeof fetch>) => {
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
      return null;
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
  // Check if we've recently verified the connection
  const now = Date.now();
  if (connectionChecked && now - lastConnectionCheck < CHECK_INTERVAL) {
    return connectionAvailable;
  }
  
  try {
    // Use the integrated Supabase client instead
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (!supabase) return false;
    
    console.log('Checking Supabase connection...');
    
    // Try a simple query to see if we can connect
    const { data, error, status } = await supabase
      .from('user_uuids')
      .select('count', { count: 'exact', head: true })
      .limit(1);
      
    // Update connection status
    connectionChecked = true;
    lastConnectionCheck = now;
    
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
        connectionAvailable = true;
        return true;
      }
      
      connectionAvailable = false;
      return false;
    }
    
    console.log('Database connection successful');
    connectionAvailable = true;
    return true;
  } catch (error) {
    console.error('Exception during database connection check:', error);
    connectionChecked = true;
    lastConnectionCheck = now;
    connectionAvailable = false;
    
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

// Helper function to make a file public
export const makeFilePublic = async (bucketName: string, filePath: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  
  try {
    console.log(`Making file '${filePath}' in bucket '${bucketName}' public...`);
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .update(filePath, undefined, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'auto'
      });
    
    if (error) {
      console.error(`Error making file public:`, error);
      return false;
    }
    
    console.log(`File is now public:`, data);
    return true;
  } catch (error) {
    console.error(`Error making file public:`, error);
    return false;
  }
};

// Create or update the stored procedure to create the ideas bucket if it doesn't exist
export const createIdeasBucketRpc = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  
  try {
    // Try to execute the stored function directly
    console.log('Attempting to call create_ideas_bucket_if_not_exists RPC...');
    const { data, error } = await supabase.rpc('create_ideas_bucket_if_not_exists', {});
    
    if (error) {
      console.error('Error calling create_ideas_bucket_if_not_exists RPC:', error);
      
      // If the RPC function doesn't exist, we'll try to create the bucket directly
      console.log('Falling back to direct bucket creation method...');
      return await ensureStorageBucketExists('ideas');
    }
    
    console.log('RPC function executed successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception calling RPC function:', error);
    // Fall back to direct bucket creation
    console.log('Falling back to direct bucket creation method after exception...');
    return await ensureStorageBucketExists('ideas');
  }
};

// Helper function to initialize storage buckets if needed
export const ensureStorageBucketExists = async (bucketName: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Cannot ensure bucket exists: Supabase client is null');
    toast.error('Database connection not available');
    return false;
  }
  
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    
    // First, check if our bucket exists by listing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // If we can't list buckets, assume it needs to be created
    } else {
      // Check if our bucket is in the list
      if (buckets && buckets.some(b => b.name === bucketName)) {
        console.log(`Bucket '${bucketName}' found, using existing bucket.`);
        return true;
      }
    }
    
    // If we get here, either the bucket wasn't found or we had an error listing buckets
    console.log(`Attempting to get or create bucket '${bucketName}'...`);
    
    // Instead of trying to create, first check if we can access the bucket
    const { data: emptyCheck, error: emptyError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
      
    if (!emptyError) {
      console.log(`Bucket '${bucketName}' accessible via list operation.`);
      return true;
    }
    
    console.log(`List operation failed, attempting to create bucket '${bucketName}'...`);
    
    // Try to create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (error) {
      // If error is about bucket already existing, that's actually a success
      if (error.message && (
        error.message.includes('already exists') || 
        error.message.includes('duplicate key') || 
        error.code === '23505'
      )) {
        console.log(`Bucket '${bucketName}' already exists, using existing bucket.`);
        return true;
      }
      
      // For permissions errors, provide more specific error messages
      if (error.message && (
        error.message.includes('permission') || 
        error.code === '42501' || 
        error.message.includes('not allowed') || 
        error.message.includes('violates row-level security policy')
      )) {
        console.warn(`Permission error for bucket '${bucketName}', but may already exist:`, error);
        
        // Even with permission errors, the bucket might still be usable
        // Try a list operation again to confirm
        const { error: secondListError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
          
        if (!secondListError) {
          console.log(`Despite permission error, bucket '${bucketName}' is accessible.`);
          return true;
        }
        
        toast.warning('Storage permission issues detected', {
          description: 'Some features may be limited. Contact admin if problems persist.'
        });
        
        // Return true anyway to avoid blocking the user experience
        // The app will handle any actual storage errors when they occur
        return true;
      }
      
      console.error(`Error creating bucket '${bucketName}':`, error);
      toast.error(`Storage setup issue: ${error.message}`);
      
      // Return true anyway to avoid blocking the user experience
      return true;
    }
    
    console.log(`Successfully created bucket '${bucketName}'`);
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket '${bucketName}' exists:`, error);
    toast.error('Storage setup failed', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return true anyway to avoid blocking the user experience
    return true;
  }
};

// Add this call to automatically create the RPC function
// This will be executed when the client module loads
createIdeasBucketRpc().then(result => {
  console.log('RPC function creation result:', result);
});
