
import { getSupabaseClient, isRlsPolicyError } from '../supabase/client';
import { verifySupabaseSetup } from './verifySetup';
import { toast } from 'sonner';

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
          
        if (!sqlError || sqlError.message?.includes('already exists') || isRlsPolicyError(sqlError)) {
          tableCreated = true;
        } else {
          console.warn('Direct table creation failed:', sqlError);
        }
      } catch (sqlError) {
        console.warn('SQL execution exception:', sqlError);
      }
    }
    
    // Try to fix RLS policies if we detect they're the issue
    let rlsFixed = false;
    try {
      // Try to disable RLS for testing (this likely won't work due to permissions)
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
    
    // Verify if fixes worked
    try {
      // Set timeout for verification to avoid getting stuck
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Fix verification timeout')), 5000);
      });
      
      const verification = await Promise.race([verifySupabaseSetup(), timeoutPromise]) as any;
      
      // Consider the fix successful if:
      // 1. The table exists AND either we have write access or we fixed RLS issues
      // 2. If we have RLS policy issues but the table exists, that's a partial success
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
