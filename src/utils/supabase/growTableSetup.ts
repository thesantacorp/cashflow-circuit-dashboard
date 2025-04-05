
import { getSupabaseClient } from './client';
import { toast } from 'sonner';

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
    
    // Create storage bucket
    let bucketCreated = await createStorageBucket();
    if (!bucketCreated) {
      console.error('Failed to create storage bucket');
      toast.error("Failed to create storage bucket");
    } else {
      console.log('Storage bucket created or verified successfully');
    }
    
    const allSuccess = projectsTableCreated && votesTableCreated && bucketCreated;
    
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

const createStorageBucket = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Checking and creating Grow storage bucket if needed...');
    
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('grow');
    
    if (!bucketError) {
      console.log('Grow storage bucket already exists');
      return true;
    }
    
    if (bucketError && !bucketError.message.includes('does not exist')) {
      console.error('Error checking storage bucket:', bucketError);
      return false;
    }
    
    // Create the bucket
    const { error: createBucketError } = await supabase.storage.createBucket('grow', {
      public: true,
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (createBucketError) {
      console.error('Error creating Grow storage bucket:', createBucketError);
      return false;
    }
    
    console.log('Grow storage bucket created successfully');
    return true;
  } catch (error) {
    console.error('Exception checking/creating storage bucket:', error);
    return false;
  }
};
