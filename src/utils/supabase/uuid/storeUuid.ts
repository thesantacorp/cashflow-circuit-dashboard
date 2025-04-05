
import { getSupabaseClient, isRlsPolicyError, checkDatabaseConnection } from '../client';
import { ensureUuidTableExists } from '../tableManagement';
import { toast } from 'sonner';
import { UuidResponse } from './types';

// Store user UUID in Supabase
export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Attempting to store UUID ${uuid} for email ${email} in Supabase...`);
    
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('No database connection available');
      toast.error('Database connection unavailable', {
        description: 'Please check your internet connection'
      });
      return false;
    }
    
    // Make sure the table exists
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
        
        const errorCode = error.code || 'unknown';
        toast.error(`Database permission error (${errorCode})`, {
          description: 'Row-Level Security policies are restricting write access',
          duration: 10000,
          action: {
            label: 'Fix Now',
            onClick: () => {
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
      
      // Try a direct insert as fallback
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

// Enhanced store with detailed response
export async function storeUserUuidWithDetails(email: string, uuid: string): Promise<UuidResponse> {
  try {
    const success = await storeUserUuid(email, uuid);
    
    if (success) {
      return { 
        success: true, 
        uuid 
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to store UUID for this email' 
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error storing UUID'
    };
  }
}
