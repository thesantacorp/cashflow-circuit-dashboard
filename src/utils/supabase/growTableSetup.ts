
import { getSupabaseClient } from './client';

export const ensureGrowTablesExist = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    // Check if projects table exists
    const { data: projectsTable, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    if (projectsError && projectsError.code === '42P01') {
      console.log('Projects table does not exist, creating...');
      await createProjectsTable();
    } else if (projectsError) {
      console.error('Error checking projects table:', projectsError);
      return false;
    }
    
    // Check if project_votes table exists
    const { data: votesTable, error: votesError } = await supabase
      .from('project_votes')
      .select('user_uuid')
      .limit(1);
      
    if (votesError && votesError.code === '42P01') {
      console.log('Project votes table does not exist, creating...');
      await createProjectVotesTable();
    } else if (votesError) {
      console.error('Error checking project votes table:', votesError);
      return false;
    }
    
    // Check if storage bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('grow');
    
    if (bucketError && bucketError.message.includes('does not exist')) {
      console.log('Grow storage bucket does not exist, creating...');
      const { error: createBucketError } = await supabase.storage.createBucket('grow', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createBucketError) {
        console.error('Error creating Grow storage bucket:', createBucketError);
      } else {
        console.log('Grow storage bucket created successfully');
      }
    }
    
    // Set up RLS policies
    await setupRlsPolicies();
    
    return true;
  } catch (error) {
    console.error('Error ensuring Grow tables exist:', error);
    return false;
  }
};

const createProjectsTable = async () => {
  const supabase = getSupabaseClient();
  
  // Need to use the SQL API for table creation
  const { error } = await supabase.rpc('create_projects_table');
  
  if (error) {
    console.error('Error creating projects table:', error);
    throw error;
  }
};

const createProjectVotesTable = async () => {
  const supabase = getSupabaseClient();
  
  // Need to use the SQL API for table creation
  const { error } = await supabase.rpc('create_project_votes_table');
  
  if (error) {
    console.error('Error creating project votes table:', error);
    throw error;
  }
};

const setupRlsPolicies = async () => {
  const supabase = getSupabaseClient();
  
  // Apply RLS policies using stored procedures
  const { error } = await supabase.rpc('setup_grow_rls_policies');
  
  if (error) {
    console.error('Error setting up RLS policies:', error);
    throw error;
  }
};
