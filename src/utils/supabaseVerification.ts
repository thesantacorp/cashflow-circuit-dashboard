
import { getSupabaseClient } from './supabase/index';
import { toast } from 'sonner';

const VERIFICATION_TIMEOUT = 8000; // 8 seconds timeout for verification

// Complete verification of Supabase connection and table setup
export async function verifySupabaseSetup(): Promise<{
  connected: boolean;
  tableExists: boolean;
  hasReadAccess: boolean;
  hasWriteAccess: boolean;
  details: string;
}> {
  const supabase = getSupabaseClient();
  let result = {
    connected: false,
    tableExists: false,
    hasReadAccess: false, 
    hasWriteAccess: false,
    details: ''
  };
  
  try {
    // Set up a timeout for the verification process
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Verification timeout')), VERIFICATION_TIMEOUT);
    });
    
    // Run verification with timeout
    try {
      return await Promise.race([
        verifySupabaseSetupInternal(),
        timeoutPromise as any
      ]);
    } catch (timeoutError) {
      console.error('Supabase verification timed out:', timeoutError);
      result.details += 'Verification timed out. ';
      return result;
    }
  } catch (error) {
    console.error('Supabase verification exception:', error);
    result.details += `Verification exception: ${error}. `;
    return result;
  }
}

// Internal verification function
async function verifySupabaseSetupInternal(): Promise<{
  connected: boolean;
  tableExists: boolean;
  hasReadAccess: boolean;
  hasWriteAccess: boolean;
  details: string;
}> {
  const supabase = getSupabaseClient();
  let result = {
    connected: false,
    tableExists: false,
    hasReadAccess: false, 
    hasWriteAccess: false,
    details: ''
  };

  try {
    // Step 1: Verify basic connection
    console.log('Testing basic Supabase connection...');
    try {
      const { data, error: connectionError } = await supabase.from('user_uuids')
        .select('count')
        .limit(1);
      
      // If we get data or a specific error about the table not existing,
      // then the connection works
      if (data || 
          (connectionError && connectionError.message.includes('does not exist')) ||
          // For RLS policy errors, connection is working but permissions are restricted
          (connectionError && connectionError.message.includes('policy'))
         ) {
        result.connected = true;
        result.details += 'Connection successful. ';
        console.log('Basic Supabase connection successful');
      } else if (connectionError) {
        result.details += `Connection failed: ${connectionError.message}. `;
        console.error('Connection error:', connectionError);
        return result;
      }
    } catch (connectionError) {
      console.error('Connection error:', connectionError);
      return result;
    }
    
    // Step 2: Check if user_uuids table exists
    console.log('Checking if user_uuids table exists...');
    try {
      const { data, error: tableError } = await supabase
        .from('user_uuids')
        .select('count')
        .limit(1);
      
      // If error is about RLS policies, the table exists but access is restricted
      if (!tableError || (tableError && tableError.message.includes('policy'))) {
        result.tableExists = true;
        result.details += 'Table exists. ';
        console.log('user_uuids table exists');
        
        // If we have RLS policy issues, note that in the details
        if (tableError && tableError.message.includes('policy')) {
          result.details += 'RLS policies restricting access. ';
        }
      } else {
        result.details += `Table error: ${tableError.message}. `;
        console.warn('Table check error:', tableError);
      }
    } catch (tableCheckError) {
      result.details += `Table check exception: ${tableCheckError}. `;
      console.error('Table check exception:', tableCheckError);
    }
    
    // Step 3: Test read access
    if (result.tableExists) {
      console.log('Testing read access...');
      const { data: readData, error: readError } = await supabase
        .from('user_uuids')
        .select('*')
        .limit(5);
      
      if (!readError || (readError && readError.message.includes('policy'))) {
        result.hasReadAccess = !readError; // Only true if no error at all
        result.details += `Read access ${!readError ? 'OK' : 'restricted by RLS'} (${readData?.length || 0} records). `;
        console.log('Read access verified, retrieved:', readData?.length || 0, 'records');
      } else {
        result.details += `Read access error: ${readError.message}. `;
        console.error('Read access error:', readError);
      }
    }
    
    // Step 4: Test write access with a temporary record
    if (result.tableExists) {
      console.log('Testing write access...');
      const testUuid = `test-${Math.random().toString(36).substring(2, 10)}`;
      const testEmail = `test-${Math.random().toString(36).substring(2, 10)}@example.com`;
      
      const { error: writeError } = await supabase
        .from('user_uuids')
        .upsert({ 
          email: testEmail, 
          uuid: testUuid 
        });
      
      // Check if write succeeded or if it's just an RLS policy restriction
      if (!writeError) {
        result.hasWriteAccess = true;
        result.details += 'Write access OK. ';
        console.log('Write access verified');
        
        // Clean up test record
        await supabase
          .from('user_uuids')
          .delete()
          .eq('email', testEmail);
      } else {
        // If we have RLS policy errors, the table exists but we don't have write access
        if (writeError.message.includes('policy')) {
          result.details += 'Write access restricted by RLS policies. ';
          console.warn('Write access restricted by RLS policies:', writeError);
        } else {
          result.details += `Write access error: ${writeError.message}. `;
          console.error('Write access error:', writeError);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Verification internal exception:', error);
    result.details += `Internal verification error: ${error}. `;
    return result;
  }
}

// Function to fix common Supabase setup issues
export async function attemptSupabaseSetupFix(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to fix Supabase setup...');
    toast.loading('Attempting to fix Supabase setup...', { id: 'fixing-supabase' });
    
    // Try to create the user_uuids table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_uuids (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        uuid TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // First try using RPC if available
    let tableCreated = false;
    
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (!rpcError) {
        tableCreated = true;
      } else {
        console.warn('RPC method failed:', rpcError);
      }
    } catch (rpcError) {
      console.warn('RPC exception:', rpcError);
    }
    
    // If RPC failed, try direct SQL (if permissions allow)
    if (!tableCreated) {
      try {
        // This will only work if the user has SQL execution permissions
        const { error: sqlError } = await supabase.from('user_uuids')
          .insert({ 
            email: 'system_test@example.com',
            uuid: 'test-uuid-for-table-creation'
          });
          
        if (!sqlError || sqlError.message.includes('already exists') || sqlError.message.includes('policy')) {
          tableCreated = true;
        } else {
          console.warn('Direct table creation failed:', sqlError);
        }
      } catch (sqlError) {
        console.warn('SQL execution exception:', sqlError);
      }
    }
    
    // Verify if fixes worked
    try {
      // Set timeout for verification to avoid getting stuck
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Fix verification timeout')), 5000);
      });
      
      const verification = await Promise.race([verifySupabaseSetup(), timeoutPromise]) as any;
      
      if (verification.tableExists) {
        toast.success('Successfully fixed Supabase setup!', { id: 'fixing-supabase' });
        return true;
      } else {
        toast.error('Could not fix Supabase setup automatically', { 
          id: 'fixing-supabase',
          description: 'Please check your Supabase project settings'
        });
        return false;
      }
    } catch (timeoutError) {
      console.error('Fix verification timed out:', timeoutError);
      toast.error('Verification timed out', { id: 'fixing-supabase' });
      return false;
    }
  } catch (error) {
    console.error('Fix attempt exception:', error);
    toast.error('Error while trying to fix Supabase setup', { id: 'fixing-supabase' });
    return false;
  }
}
