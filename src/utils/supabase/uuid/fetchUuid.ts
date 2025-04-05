
import { getSupabaseClient, isRlsPolicyError } from '../client';
import { toast } from 'sonner';
import { UuidResponse } from './types';

// Fetch user UUID from Supabase
export async function fetchUserUuid(email: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Normalize the email
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

// Enhanced fetch with detailed response
export async function fetchUserUuidWithDetails(email: string): Promise<UuidResponse> {
  try {
    const uuid = await fetchUserUuid(email);
    
    if (uuid) {
      return { 
        success: true, 
        uuid 
      };
    } else {
      return { 
        success: false, 
        error: 'UUID not found for this email' 
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching UUID'
    };
  }
}
