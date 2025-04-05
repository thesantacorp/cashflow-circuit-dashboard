
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';
import { createProjectsTable, createProjectVotesTable, createAllGrowTables } from './tableOperations';
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
    
    // Create all tables in the correct order
    const tablesCreated = await createAllGrowTables();
    
    if (!tablesCreated) {
      console.error('Failed to create some Grow tables');
      toast.error("Failed to initialize database tables");
      return false;
    }
    
    console.log('All database tables created or verified successfully');
    
    // Create storage bucket - with guaranteed success approach
    const bucketCreated = await createStorageBucketGuaranteed();
    
    if (!bucketCreated) {
      console.error('Failed to create storage bucket');
      toast.warning("File storage initialization failed");
      // Continue anyway since we can operate without storage
    }
    
    console.log('All Grow tables and resources successfully initialized');
    return true;
  } catch (error) {
    console.error('Error ensuring Grow tables exist:', error);
    toast.error("Failed to initialize Grow database");
    return false;
  }
};

// Export all table operations for direct access
export { createProjectsTable, createProjectVotesTable, createAllGrowTables } from './tableOperations';
