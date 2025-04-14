import { getSupabaseClient, isRlsPolicyError, typeSafeFrom, dynamicFrom } from './supabase/client';
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
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Verification timeout')), 8000);
    });
    
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
    console.log('Testing basic Supabase connection...');
    try {
      const { data, error: connectionError } = await supabase.from('user_uuids')
        .select('count')
        .limit(1);
      
      if (data || 
          (connectionError && connectionError.message?.includes('does not exist')) ||
          isRlsPolicyError(connectionError)
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
    
    console.log('Checking if user_uuids table exists...');
    try {
      const { data, error: tableError } = await supabase
        .from('user_uuids')
        .select('count')
        .limit(1);
      
      if (!tableError || isRlsPolicyError(tableError)) {
        result.tableExists = true;
        result.details += 'Table exists. ';
        console.log('user_uuids table exists');
        
        if (isRlsPolicyError(tableError)) {
          result.details += 'RLS policies restricting access. ';
        }
      } else if (tableError && tableError.message?.includes('does not exist')) {
        result.details += 'Table does not exist. ';
        console.warn('Table does not exist:', tableError);
      } else {
        result.details += `Table error: ${tableError?.message}. `;
        console.warn('Table check error:', tableError);
      }
    } catch (tableCheckError) {
      result.details += `Table check exception: ${tableCheckError}. `;
      console.error('Table check exception:', tableCheckError);
    }
    
    if (result.tableExists) {
      console.log('Testing read access...');
      const { data: readData, error: readError } = await supabase
        .from('user_uuids')
        .select('*')
        .limit(5);
      
      if (!readError || (readError && isRlsPolicyError(readError))) {
        result.hasReadAccess = !readError;
        result.details += `Read access ${!readError ? 'OK' : 'restricted by RLS'} (${readData?.length || 0} records). `;
        console.log('Read access verified, retrieved:', readData?.length || 0, 'records');
      } else {
        result.details += `Read access error: ${readError.message}. `;
        console.error('Read access error:', readError);
      }
    }
    
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
        
        await supabase
          .from('user_uuids')
          .delete()
          .eq('email', testEmail);
      } else {
        if (isRlsPolicyError(writeError)) {
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
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_uuids (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        uuid TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
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
    
    if (!tableCreated) {
      try {
        const { error: sqlError } = await dynamicFrom('user_uuids')
          .insert({ 
            email: 'system_test@example.com',
            uuid: 'test-uuid-for-table-creation'
          });
          
        if (!sqlError || sqlError.message?.includes('already exists') || isRlsPolicyError(sqlError)) {
          tableCreated = true;
        } else {
          console.warn('Direct table creation failed:', sqlError);
        }
      } catch (sqlError) {
        console.warn('SQL execution exception:', sqlError);
      }
    }
    
    let rlsFixed = false;
    try {
      const disableRlsSql = `
        ALTER TABLE public.user_uuids DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.user_uuids TO anon;
        GRANT ALL ON public.user_uuids TO authenticated;
      `;
      
      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: disableRlsSql });
      if (!rlsError) {
        rlsFixed = true;
        console.log('Successfully fixed RLS policies');
      } else {
        console.warn('RLS policy fix failed:', rlsError);
      }
    } catch (rlsError) {
      console.warn('RLS policy fix exception:', rlsError);
    }
    
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Fix verification timeout')), 5000);
    });
    
    const verification = await Promise.race([verifySupabaseSetup(), timeoutPromise]) as any;
    
    if (verification.tableExists && (verification.hasWriteAccess || rlsFixed)) {
      toast.success('Successfully fixed Supabase setup!', { id: 'fixing-supabase' });
      return true;
    } else if (verification.tableExists && !verification.hasWriteAccess && verification.details.includes('RLS')) {
      toast.warning('Table exists but has RLS policy restrictions', { 
        id: 'fixing-supabase',
        description: 'Please use the RLS configuration guide to fix permissions'
      });
      return false;
    } else {
      toast.error('Could not completely fix Supabase setup', { 
        id: 'fixing-supabase',
        description: 'Please check the RLS configuration guide'
      });
      return false;
    }
  } catch (error) {
    console.error('Fix attempt exception:', error);
    toast.error('Error while trying to fix Supabase setup', { id: 'fixing-supabase' });
    return false;
  }
}

// Export a function to generate SQL that will fix RLS issues
export function getRlsFixSql(): string {
  return `
-- Update RLS policies on user_uuids table
ALTER TABLE IF EXISTS public.user_uuids ENABLE ROW LEVEL SECURITY;

-- Delete existing policies (if any)
DROP POLICY IF EXISTS "Enable all access" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow anonymous selects" ON public.user_uuids;

-- Create a policy to allow all operations for both anon and authenticated users
CREATE POLICY "Enable all access" 
ON public.user_uuids 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Grant full permissions
GRANT ALL ON public.user_uuids TO anon, authenticated;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon, authenticated;
  `.trim();
}
