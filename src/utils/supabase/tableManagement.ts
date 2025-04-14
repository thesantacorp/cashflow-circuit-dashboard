
import { getSupabaseClient, typeSafeFrom, dynamicFrom } from './client';
import { toast } from 'sonner';

// Helper to check if a table exists in Supabase
export async function checkTableExists(tableName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Checking if ${tableName} table exists...`);
    
    // Type-safe approach: use a dynamic query that works with string table names
    if (tableName === 'user_uuids') {
      // Try to select a single row from the specific table
      const { data, error } = await typeSafeFrom('user_uuids')
        .select('id')
        .limit(1);
        
      // If no error, table exists
      const exists = !error;
      console.log(`Table ${tableName} exists: ${exists}`);
      return exists;
    } else {
      // For any other table (future-proofing), use a more generic approach
      // Use the dynamicFrom function for dynamic table names
      console.log(`Warning: checking for table other than user_uuids: ${tableName}`);
      const { data, error } = await dynamicFrom(tableName)
        .select('count')
        .limit(1);
        
      return !error || (error.message && error.message.includes('permission denied'));
    }
  } catch (error) {
    console.error(`Error checking if ${tableName} table exists:`, error);
    return false;
  }
}

// Check if the user_uuids table exists, create it if it doesn't
export async function ensureUuidTableExists(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Ensuring user_uuids table exists...');
    
    // First check if the table exists
    const tableExists = await checkTableExists('user_uuids');
    
    // If table exists, return true
    if (tableExists) {
      console.log('user_uuids table exists and is accessible');
      return true;
    }
    
    // Define a SQL script to create the table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_uuids (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        uuid TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Creating user_uuids table with SQL:', createTableSQL);
    
    // Try direct SQL execution with rpc (if function is available)
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (sqlError) {
        console.error('Error executing SQL via RPC:', sqlError);
        throw new Error('RPC failed');
      }
    } catch (rpcError) {
      console.warn('RPC method failed, trying alternative approach:', rpcError);
      
      // Try creating the table via REST API with dynamicFrom
      const { error: restError } = await dynamicFrom('user_uuids')
        .insert({ 
          email: 'system_test@example.com',
          uuid: 'test-uuid-for-table-creation'
        });
      
      // If error is not about table not existing, we have a different problem
      if (restError && !restError.message.includes('relation') && !restError.message.includes('does not exist')) {
        console.error('Error creating table via REST:', restError);
        return false;
      }
    }
    
    // Verify the table exists now
    const verifyExists = await checkTableExists('user_uuids');
    
    if (!verifyExists) {
      console.error('Table creation failed or verification failed');
      
      // Show instruction for manual table creation
      toast.error(
        'Could not automatically create the user_uuids table', 
        {
          description: 'Please create it manually in your Supabase project',
          duration: 10000
        }
      );
      
      return false;
    }
    
    console.log('Successfully created or verified user_uuids table');
    return true;
  } catch (error) {
    console.error('Exception ensuring user_uuids table exists:', error);
    return false;
  }
}
