
import { getSupabaseClient, isRlsPolicyError, checkDatabaseConnection } from './client';
import { ensureUuidTableExists } from './tableManagement';
import { toast } from 'sonner';

// Store user UUID in Supabase
export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Attempting to store UUID ${uuid} for email ${email} in Supabase...`);
    
    // First check if we have a database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('No database connection available');
      toast.error('Database connection unavailable', {
        description: 'Please check your internet connection'
      });
      return false;
    }
    
    // Then make sure the table exists
    await ensureUuidTableExists();
    
    // Insert the record
    const { error } = await supabase
      .from('user_uuids')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        uuid: uuid 
      }, { onConflict: 'email' });
      
    if (error) {
      // Enhanced RLS policy error detection and reporting
      if (isRlsPolicyError(error)) {
        console.error('RLS policy error storing user UUID:', error);
        
        // More specific error message with code and action
        const errorCode = error.code || 'unknown';
        toast.error(`Database permission error (${errorCode})`, {
          description: 'Row-Level Security policies are restricting write access',
          duration: 10000,
          action: {
            label: 'Fix Now',
            onClick: () => {
              // Show the RLS config guide component
              const rlsGuide = document.getElementById('rls-config-guide');
              if (rlsGuide) {
                rlsGuide.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        });
        return false;
      }
      
      console.error('Error storing user UUID in Supabase:', error);
      
      // Try a direct insert as fallback with a different method
      const { error: insertError } = await supabase
        .from('user_uuids')
        .insert([
          { email: email.toLowerCase().trim(), uuid: uuid }
        ]);
        
      if (insertError) {
        if (isRlsPolicyError(insertError)) {
          console.error('RLS policy error during direct insert:', insertError);
          
          // More actionable error message
          toast.error('Database permissions issue', {
            description: 'Please follow the RLS configuration guide below',
            duration: 10000
          });
        } else {
          console.error('Direct insert failed:', insertError);
          toast.error(`Database error: ${insertError.message || 'Unknown error'}`, {
            duration: 8000
          });
        }
        return false;
      }
    }
    
    console.log(`Successfully stored UUID for ${email}`);
    return true;
  } catch (error) {
    console.error('Exception when storing user UUID in Supabase:', error);
    toast.error('Failed to store user ID in database', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

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
