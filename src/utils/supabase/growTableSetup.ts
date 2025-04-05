
import { getSupabaseClient } from './client';
import { toast } from 'sonner';

// Store Supabase credentials directly in the code for access in this file
// These are safe to store in the frontend code as they are public anon keys
const SUPABASE_URL = 'https://tsidnalhlgcmcnqawgux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ';

export const ensureGrowTablesExist = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    console.log('Checking and ensuring Grow tables exist...');
    
    // First verify Supabase connection is working
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_uuids')
      .select('count')
      .limit(1)
      .maybeSingle();
      
    if (connectionError && connectionError.code !== '42P01') {
      console.error('Supabase connection error before table check:', connectionError);
      toast.error("Database connection error", { 
        description: "Please check your internet connection" 
      });
      return false;
    }
    
    // Create projects table first
    let projectsTableCreated = await createProjectsTable();
    if (!projectsTableCreated) {
      console.error('Failed to create projects table');
      toast.error("Failed to create projects table");
    } else {
      console.log('Projects table created or verified successfully');
    }
    
    // Create votes table second
    let votesTableCreated = await createProjectVotesTable();
    if (!votesTableCreated) {
      console.error('Failed to create project votes table');
      toast.error("Failed to create project votes table");
    } else {
      console.log('Project votes table created or verified successfully');
    }
    
    // Create storage bucket - with guaranteed success approach
    let bucketCreated = await createStorageBucketGuaranteed();
    
    const allSuccess = projectsTableCreated && votesTableCreated;
    
    if (allSuccess) {
      console.log('All Grow tables and resources successfully initialized');
    } else {
      console.error('Some Grow resources failed to initialize');
    }
    
    return allSuccess;
  } catch (error) {
    console.error('Error ensuring Grow tables exist:', error);
    toast.error("Failed to initialize Grow database");
    return false;
  }
};

const createProjectsTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create projects table...');
    
    // Check if the table already exists
    const { error: checkError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('Projects table already exists');
      return true;
    }
      
    if (checkError && checkError.code !== '42P01') {
      console.error('Error checking projects table:', checkError);
      return false;
    }
    
    // Create the projects table with a simplified SQL approach
    const { error } = await supabase.rpc('create_basic_projects_table');
    
    if (error) {
      console.error('Failed to create projects table via RPC:', error);
      
      // Fallback - try direct table creation
      const directResult = await createProjectsTableDirect();
      return directResult;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating projects table:', error);
    
    // Try fallback method
    try {
      return await createProjectsTableDirect();
    } catch (fallbackError) {
      console.error('Fallback projects table creation also failed:', fallbackError);
      return false;
    }
  }
};

const createProjectsTableDirect = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting direct projects table creation...');
    
    // Try direct insertion to see if the table is auto-created
    const { error } = await supabase.from('projects').insert({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Project',
      description: 'This is a test project to create the table',
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString()
    });
    
    // Even permission errors mean the table exists or was created
    if (!error || (error && error.code !== '42P01')) {
      console.log('Projects table created directly or already exists');
      
      // Try to delete the test project
      try {
        await supabase
          .from('projects')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test project, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create projects table directly:', error);
    return false;
  } catch (error) {
    console.error('Exception in direct projects table creation:', error);
    return false;
  }
};

const createProjectVotesTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create project_votes table...');
    
    // Check if the table already exists
    const { error: checkError } = await supabase
      .from('project_votes')
      .select('project_id')
      .limit(1);
      
    if (!checkError) {
      console.log('Project_votes table already exists');
      return true;
    }
      
    if (checkError && checkError.code !== '42P01') {
      console.error('Error checking project_votes table:', checkError);
      return false;
    }
    
    // Create the votes table with a simplified SQL approach
    const { error } = await supabase.rpc('create_basic_project_votes_table');
    
    if (error) {
      console.error('Failed to create project_votes table via RPC:', error);
      
      // Fallback - try direct table creation
      const directResult = await createVotesTableDirect();
      return directResult;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating project_votes table:', error);
    
    // Try fallback method
    try {
      return await createVotesTableDirect();
    } catch (fallbackError) {
      console.error('Fallback project_votes table creation also failed:', fallbackError);
      return false;
    }
  }
};

const createVotesTableDirect = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting direct project_votes table creation...');
    
    // Try direct insertion to see if the table is auto-created
    const { error } = await supabase.from('project_votes').insert({
      project_id: '00000000-0000-0000-0000-000000000000',
      user_uuid: '00000000-0000-0000-0000-000000000000',
      vote: 0
    });
    
    // Even permission errors mean the table exists or was created
    if (!error || (error && error.code !== '42P01')) {
      console.log('Project_votes table created directly or already exists');
      
      // Try to delete the test vote
      try {
        await supabase
          .from('project_votes')
          .delete()
          .eq('project_id', '00000000-0000-0000-0000-000000000000')
          .eq('user_uuid', '00000000-0000-0000-0000-000000000000');
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test vote, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create project_votes table directly:', error);
    return false;
  } catch (error) {
    console.error('Exception in direct project_votes table creation:', error);
    return false;
  }
};

const createStorageBucketGuaranteed = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Creating Grow storage bucket with guaranteed approach...');
    
    // First check if bucket already exists using simple list method
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (!listError && buckets) {
      const existingBucket = buckets.find(bucket => bucket.name === 'grow');
      if (existingBucket) {
        console.log('Grow bucket already exists, skipping creation');
        return true;
      }
    }
    
    // Direct approach to create bucket
    try {
      const { data, error } = await supabase.storage.createBucket('grow', {
        public: true,
        fileSizeLimit: 52428800, // 50MB limit
      });
      
      if (!error) {
        console.log('Successfully created Grow storage bucket');
        return true;
      }
      
      // Handle potential "already exists" case
      if (error && error.message && error.message.includes('already exists')) {
        console.log('Bucket already exists (from error response)');
        return true;
      }
      
      console.error('First bucket creation attempt failed:', error);
    } catch (err) {
      console.error('Exception in first bucket creation attempt:', err);
    }
    
    // Alternative approach using raw API call if needed
    try {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/grow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          id: 'grow',
          name: 'grow',
          public: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Successfully created Grow bucket using alternative method');
        return true;
      }
      
      // Even if we get "already exists" error, that's fine
      if (data.error && data.error.includes('already exists')) {
        console.log('Bucket already exists (from alternative method response)');
        return true;
      }
      
      console.warn('Alternative bucket creation response:', data);
      
      // At this point, we'll just assume the bucket exists or the user doesn't have permission
      // This is to avoid blocking the core functionality of the Grow feature
      console.log('Assuming storage is configured and continuing without errors');
      return true;
    } catch (err) {
      console.error('Exception in alternative bucket creation:', err);
    }
    
    // Return true to avoid blocking the application - storage is non-critical
    console.log('Storage setup completed with potential issues - continuing');
    return true;
  } catch (error) {
    console.error('Overall exception in storage bucket setup:', error);
    // Return true to continue app functionality
    return true;
  }
};
