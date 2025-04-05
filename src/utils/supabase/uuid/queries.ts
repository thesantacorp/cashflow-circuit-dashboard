
import { getSupabaseClient, isRlsPolicyError } from '../client';
import { ensureUuidTableExists } from '../tableManagement';
import { toast } from 'sonner';
import { UuidRecord } from './types';

// Get all UUIDs with pagination
export async function getAllUuids(page: number = 1, limit: number = 20): Promise<UuidRecord[] | null> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Fetching UUIDs (page ${page}, limit ${limit}) from Supabase...`);
    
    // Check if the table exists
    const tableExists = await ensureUuidTableExists();
    if (!tableExists) {
      console.log('user_uuids table does not exist in Supabase');
      return null;
    }
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Fetch records with pagination
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      if (isRlsPolicyError(error)) {
        console.error('RLS policy error fetching UUIDs:', error);
        toast.error('Permission denied listing users', {
          description: 'Administrator access required for this operation'
        });
      } else {
        console.error('Error fetching UUIDs from Supabase:', error);
      }
      return null;
    }
    
    console.log(`Retrieved ${data?.length || 0} UUIDs from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Exception when fetching UUIDs from Supabase:', error);
    return null;
  }
}

// Get UUID count
export async function getUuidCount(): Promise<number> {
  const supabase = getSupabaseClient();
  
  try {
    // Check if the table exists
    const tableExists = await ensureUuidTableExists();
    if (!tableExists) {
      return 0;
    }
    
    // Count records
    const { count, error } = await supabase
      .from('user_uuids')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error counting UUIDs in Supabase:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Exception when counting UUIDs in Supabase:', error);
    return 0;
  }
}

// Search UUIDs by email
export async function searchUuidsByEmail(searchTerm: string): Promise<UuidRecord[] | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Check if the table exists
    const tableExists = await ensureUuidTableExists();
    if (!tableExists) {
      return null;
    }
    
    // Search for records
    const { data, error } = await supabase
      .from('user_uuids')
      .select('*')
      .ilike('email', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error searching UUIDs in Supabase:', error);
      return null;
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception when searching UUIDs in Supabase:', error);
    return null;
  }
}
