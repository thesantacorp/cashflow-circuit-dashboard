
import { getSupabaseClient, isRlsPolicyError } from '../client';
import { ensureUuidTableExists } from '../tableManagement';
import { toast } from 'sonner';

// Verify if a UUID exists in Supabase
export async function verifyUuidInSupabase(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Verifying UUID ${uuid} for ${normalizedEmail} in Supabase...`);
    
    // Check if the table exists
    const tableExists = await ensureUuidTableExists();
    
    if (!tableExists) {
      console.log('user_uuids table does not exist in Supabase');
      return false;
    }
    
    // Query for the specific UUID
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('uuid', uuid);
      
    if (error) {
      if (isRlsPolicyError(error)) {
        console.error('RLS policy error verifying UUID:', error);
        toast.error('Permission denied verifying user data', {
          description: 'Database policies are preventing verification'
        });
      } else {
        console.error('Error verifying UUID in Supabase:', error);
      }
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log(`UUID verification result for ${normalizedEmail}: ${exists ? 'Found' : 'Not found'}`);
    return exists;
  } catch (error) {
    console.error('Exception when verifying UUID in Supabase:', error);
    return false;
  }
}
