
import { getSupabaseClient, isRlsPolicyError } from '../client';
import { toast } from 'sonner';

// Fetch user UUID from Supabase
export async function fetchUserUuid(email: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Make sure we normalize the email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Attempting to fetch UUID for email ${normalizedEmail} from Supabase...`);
    
    const { data, error } = await supabase
      .from('user_uuids')
      .select('uuid')
      .eq('email', normalizedEmail)
      .single();
      
    if (error) {
      if (isRlsPolicyError(error)) {
        console.error('RLS policy error fetching user UUID:', error);
        toast.error('Permission denied reading user data', {
          description: 'Database policies are preventing data access'
        });
      } else {
        console.error('Error fetching user UUID from Supabase:', error);
      }
      return null;
    }
    
    console.log(`Retrieved UUID for ${normalizedEmail}:`, data?.uuid);
    return data?.uuid || null;
  } catch (error) {
    console.error('Exception when fetching user UUID from Supabase:', error);
    return null;
  }
}
