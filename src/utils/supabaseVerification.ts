
import { getSupabaseClient } from './supabase/index';
import { toast } from 'sonner';

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
    // Step 1: Verify basic connection
    console.log('Testing basic Supabase connection...');
    const { error: connectionError } = await supabase.from('_health_check')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    // Expected error is about table not existing, which means connection works
    if (!connectionError || connectionError.message.includes('does not exist')) {
      result.connected = true;
      result.details += 'Connection successful. ';
      console.log('Basic Supabase connection successful');
    } else {
      result.details += `Connection failed: ${connectionError.message}. `;
      console.error('Connection error:', connectionError);
      return result;
    }
    
    // Step 2: Check if user_uuids table exists
    console.log('Checking if user_uuids table exists...');
    try {
      const { error: tableError } = await supabase
        .from('user_uuids')
        .select('count')
        .limit(1);
      
      if (!tableError) {
        result.tableExists = true;
        result.details += 'Table exists. ';
        console.log('user_uuids table exists');
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
      
      if (!readError) {
        result.hasReadAccess = true;
        result.details += `Read access OK (${readData?.length || 0} records). `;
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
        result.details += `Write access error: ${writeError.message}. `;
        console.error('Write access error:', writeError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Supabase verification exception:', error);
    result.details += `Verification exception: ${error}. `;
    return result;
  }
}

// Function to fix common Supabase setup issues
export async function attemptSupabaseSetupFix(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to fix Supabase setup...');
    toast.loading('Attempting to fix Supabase setup...', { id: 'fixing-supabase' });
    
    // If RLS is blocking writes, check if the user accessing Supabase 
    // has appropriate permissions to modify the RLS policy
    const verification = await verifySupabaseSetup();
    if (verification.connected && verification.tableExists && !verification.hasWriteAccess) {
      // We need to tell the user they need to fix their RLS policies
      toast.warning('Row Level Security preventing writes', { 
        id: 'fixing-supabase',
        description: 'Contact administrator to update RLS policies',
        duration: 8000
      });
      console.warn('Unable to fix RLS issues automatically');
      return false;
    }
    
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
          
        if (!sqlError || sqlError.message.includes('already exists')) {
          tableCreated = true;
        } else {
          console.warn('Direct table creation failed:', sqlError);
        }
      } catch (sqlError) {
        console.warn('SQL execution exception:', sqlError);
      }
    }
    
    // Verify if fixes worked
    const newVerification = await verifySupabaseSetup();
    
    if (newVerification.tableExists) {
      toast.success('Successfully fixed Supabase setup!', { id: 'fixing-supabase' });
      return true;
    } else {
      toast.error('Could not fix Supabase setup automatically', { 
        id: 'fixing-supabase',
        description: 'Please check your Supabase project settings'
      });
      return false;
    }
  } catch (error) {
    console.error('Fix attempt exception:', error);
    toast.error('Error while trying to fix Supabase setup', { id: 'fixing-supabase' });
    return false;
  }
}
