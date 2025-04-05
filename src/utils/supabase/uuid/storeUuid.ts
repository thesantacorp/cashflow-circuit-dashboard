
import { getSupabaseClient, isRlsPolicyError, checkDatabaseConnection } from '../client';
import { ensureUuidTableExists } from '../tableManagement';
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
      return await attemptDirectInsert(email, uuid);
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

// Helper function for fallback direct insert
async function attemptDirectInsert(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
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
    
    return true;
  } catch (error) {
    console.error('Exception during direct insert:', error);
    return false;
  }
}
