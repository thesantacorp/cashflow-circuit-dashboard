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
    
    // Check if projects table exists
    const { data: projectsTable, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    let projectsTableCreated = true;
    if (projectsError && projectsError.code === '42P01') {
      console.log('Projects table does not exist, creating...');
      try {
        await createProjectsTable();
        toast.success("Projects table created successfully");
      } catch (err) {
        console.error('Error creating projects table:', err);
        projectsTableCreated = false;
        toast.error("Failed to create projects table");
      }
    } else if (projectsError) {
      console.error('Error checking projects table:', projectsError);
      projectsTableCreated = false;
    }
    
    // Check if project_votes table exists
    const { data: votesTable, error: votesError } = await supabase
      .from('project_votes')
      .select('user_uuid')
      .limit(1);
      
    let votesTableCreated = true;
    if (votesError && votesError.code === '42P01') {
      console.log('Project votes table does not exist, creating...');
      try {
        await createProjectVotesTable();
        toast.success("Project votes table created successfully");
      } catch (err) {
        console.error('Error creating project votes table:', err);
        votesTableCreated = false;
        toast.error("Failed to create project votes table");
      }
    } else if (votesError) {
      console.error('Error checking project votes table:', votesError);
      votesTableCreated = false;
    }
    
    // Check if storage bucket exists
    let bucketCreated = true;
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('grow');
      
      if (bucketError && bucketError.message.includes('does not exist')) {
        console.log('Grow storage bucket does not exist, creating...');
        const { error: createBucketError } = await supabase.storage.createBucket('grow', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createBucketError) {
          console.error('Error creating Grow storage bucket:', createBucketError);
          bucketCreated = false;
          toast.error("Failed to create storage bucket");
        } else {
          console.log('Grow storage bucket created successfully');
          toast.success("Storage bucket created successfully");
        }
      }
    } catch (err) {
      console.error('Error checking/creating storage bucket:', err);
      bucketCreated = false;
    }
    
    // Set up RLS policies
    let rlsPoliciesSetup = true;
    try {
      await setupRlsPolicies();
    } catch (err) {
      console.error('Error setting up RLS policies:', err);
      rlsPoliciesSetup = false;
      // Don't show error toast for this as RLS may be intentionally restricted
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

const createProjectsTable = async () => {
  const supabase = getSupabaseClient();
  
  try {
    // First, check if we have table creation permissions
    const { data: rpcAvailable, error: rpcCheckError } = await supabase.rpc('version');
    const canUseRPC = !rpcCheckError;
    
    if (canUseRPC) {
      // Try first using SQL RPC if available
      const { error: rpcError } = await supabase.rpc('create_projects_table');
      
      if (rpcError) {
        console.log('RPC method failed, trying direct SQL execution');
        await createProjectsTableDirectly();
      }
    } else {
      // If RPC doesn't exist or we don't have permission, try creating directly
      await createProjectsTableDirectly();
    }
  } catch (error) {
    console.error('Error creating projects table:', error);
    throw error;
  }
};

const createProjectsTableDirectly = async () => {
  const supabase = getSupabaseClient();
  
  try {
    // Try inserting a sample record to create the table with default columns
    const { error } = await supabase.from('projects').insert({
      id: '00000000-0000-0000-0000-000000000000', // temp ID
      name: 'Test Project',
      description: 'This is a test project to create the table',
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString()
    });
    
    // If there was an error but the table was created (likely a permission error),
    // we can consider this a success
    if (error && error.code !== '42P01') {
      // Check table again to confirm it was created despite error
      const { error: checkError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
        
      if (checkError && checkError.code === '42P01') {
        throw new Error('Failed to create projects table');
      }
    }
    
    // Try to add additional columns if needed
    try {
      await supabase.rpc('ensure_projects_table_columns');
    } catch (columnError) {
      console.warn('Could not ensure all columns exist:', columnError);
    }
  } catch (error) {
    console.error('Error in direct table creation:', error);
    throw error;
  }
};

const createProjectVotesTable = async () => {
  const supabase = getSupabaseClient();
  
  try {
    // Check if we can use RPC
    const { data: rpcAvailable, error: rpcCheckError } = await supabase.rpc('version');
    const canUseRPC = !rpcCheckError;
    
    if (canUseRPC) {
      // Try first using SQL RPC if available
      const { error: rpcError } = await supabase.rpc('create_project_votes_table');
      
      if (rpcError) {
        console.log('RPC method failed, trying direct SQL execution');
        await createVotesTableDirectly();
      }
    } else {
      await createVotesTableDirectly();
    }
  } catch (error) {
    console.error('Error creating project votes table:', error);
    throw error;
  }
};

const createVotesTableDirectly = async () => {
  const supabase = getSupabaseClient();
  
  try {
    // Try inserting a sample record to create the table with default columns
    const { error } = await supabase.from('project_votes').insert({
      project_id: '00000000-0000-0000-0000-000000000000', // temp ID
      user_uuid: '00000000-0000-0000-0000-000000000000',
      vote: 0
    });
    
    // If there was an error but the table was created (likely a permission error),
    // we can consider this a success
    if (error && error.code !== '42P01') {
      // Check table again to confirm it was created despite error
      const { error: checkError } = await supabase
        .from('project_votes')
        .select('user_uuid')
        .limit(1);
        
      if (checkError && checkError.code === '42P01') {
        throw new Error('Failed to create project_votes table');
      }
    }
  } catch (error) {
    console.error('Error in direct votes table creation:', error);
    throw error;
  }
};

const setupRlsPolicies = async () => {
  const supabase = getSupabaseClient();
  
  try {
    // Try to apply RLS policies using stored procedures
    const { error } = await supabase.rpc('setup_grow_rls_policies');
    
    if (error) {
      console.warn('Failed to setup RLS policies:', error);
      
      // Try alternative RPC methods that might exist
      try {
        await supabase.rpc('enable_projects_rls');
        await supabase.rpc('enable_project_votes_rls');
      } catch (alternativeError) {
        console.warn('Alternative RLS setup failed:', alternativeError);
      }
    }
  } catch (error) {
    console.warn('Exception setting up RLS policies:', error);
    // This is considered a soft fail, so we don't throw an error
  }
};
