
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';
import { createProjectsTable, createProjectVotesTable, createAllGrowTables, disableRlsPoliciesForGrowTables } from './tableOperations';
import { createStorageBucketGuaranteed } from './storageOperations';
import { checkSupabaseConnection } from '../../supabaseInit';

export const ensureGrowTablesExist = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    console.log('Checking and ensuring Grow tables exist...');
    
    // First verify Supabase connection is working
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection not available');
      toast.error("Database connection error", { 
        description: "Please check your internet connection" 
      });
      return false;
    }
    
    console.log('Supabase connection verified, proceeding with table creation');
    
    // Create all tables using the direct method without RPC
    console.log('Attempting to create tables with direct method...');
    const tablesCreated = await createAllGrowTables();
    
    if (!tablesCreated) {
      console.error('Failed to create Grow tables');
      toast.error("Failed to initialize database tables");
      return false;
    }
    
    console.log('All database tables created or verified successfully');
    
    // Create storage bucket - with guaranteed success approach
    const bucketCreated = await createStorageBucketGuaranteed();
    
    if (!bucketCreated) {
      console.warn('Failed to create storage bucket');
      toast.warning("File storage initialization failed", {
        description: "Project images may not be supported"
      });
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
export { 
  createProjectsTable, 
  createProjectVotesTable, 
  createAllGrowTables, 
  disableRlsPoliciesForGrowTables 
} from './tableOperations';
