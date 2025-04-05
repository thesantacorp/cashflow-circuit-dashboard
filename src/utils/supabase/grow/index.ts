
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';
import { createProjectsTable, createProjectVotesTable } from './tableOperations';
import { createStorageBucketGuaranteed } from './storageOperations';

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
