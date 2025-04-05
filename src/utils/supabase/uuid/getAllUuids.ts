
import { getSupabaseClient, isRlsPolicyError } from '../client';
import { ensureUuidTableExists } from '../tableManagement';
import { toast } from 'sonner';

// Get all stored UUIDs (for admin/verification purposes)
export async function getAllUuids(): Promise<any[] | null> {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Fetching all UUIDs from Supabase...');
    
    // Check if the table exists first
    const tableExists = await ensureUuidTableExists();
    
    if (!tableExists) {
      console.log('user_uuids table does not exist in Supabase');
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      if (isRlsPolicyError(error)) {
        console.error('RLS policy error fetching all UUIDs:', error);
        toast.error('Permission denied listing users', {
          description: 'Administrator access required for this operation'
        });
      } else {
        console.error('Error fetching all UUIDs from Supabase:', error);
      }
      return null;
    }
    
    console.log(`Retrieved ${data?.length || 0} UUIDs from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Exception when fetching all UUIDs from Supabase:', error);
    return null;
  }
}
