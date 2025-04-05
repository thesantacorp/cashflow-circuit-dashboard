
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { 
  fetchUserUuid, 
  storeUserUuid, 
  ensureUuidTableExists, 
  verifyUuidInSupabase,
  getSupabaseClient 
} from "@/utils/supabase";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableVerified, setTableVerified] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local-only' | 'unknown'>('unknown');

  // Verify database connection on mount
  useEffect(() => {
    const verifyDatabase = async () => {
      try {
        // Test direct Supabase connection before proceeding
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('_health_check').select('*').maybeSingle();
        
        // The error is expected (table not found), what matters is that the request went through
        if (!error || (error && error.message.includes('does not exist'))) {
          console.log('Supabase connection successful in useUuidManagement');
        } else {
          console.error('Supabase connection issue:', error);
        }
      } catch (error) {
        console.warn('Could not verify Supabase connection:', error);
      }
    };
    
    verifyDatabase();
  }, []);

  // Check for saved UUID and email
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      try {
        // First verify that the table exists
        if (!tableVerified) {
          try {
            const exists = await ensureUuidTableExists();
            setTableVerified(exists);
            console.log('UUID table exists or created:', exists);
            
            if (!exists) {
              console.warn("UUID table does not exist or cannot be created");
            }
          } catch (tableError) {
            console.error("Error verifying/creating UUID table:", tableError);
          }
        }
        
        // First check localStorage to maintain backward compatibility
        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) {
          setUserEmail(savedEmail);
          console.log('Found email in localStorage:', savedEmail);
          
          // Try to fetch from Supabase first
          let supabaseUuid = null;
          
          if (tableVerified) {
            try {
              supabaseUuid = await fetchUserUuid(savedEmail);
              console.log('Supabase UUID fetch result:', supabaseUuid);
            } catch (fetchError) {
              console.error('Error fetching UUID from Supabase:', fetchError);
            }
          }
          
          if (supabaseUuid) {
            console.log(`Retrieved UUID from Supabase for ${savedEmail}`);
            setUserUuid(supabaseUuid);
            setSyncStatus('synced');
            // Update localStorage with the Supabase UUID
            localStorage.setItem("userUuid", supabaseUuid);
          } else {
            // Fall back to localStorage UUID if no Supabase UUID
            const localUuid = localStorage.getItem("userUuid");
            if (localUuid) {
              console.log(`Using local UUID for ${savedEmail}:`, localUuid);
              setUserUuid(localUuid);
              setSyncStatus('local-only');
              
              // If table exists, try to migrate localStorage UUID to Supabase
              if (tableVerified) {
                try {
                  console.log(`Attempting to migrate local UUID ${localUuid} to Supabase for ${savedEmail}`);
                  const success = await storeUserUuid(savedEmail, localUuid);
                  
                  if (success) {
                    console.log(`Migrated local UUID to Supabase for ${savedEmail}`);
                    setSyncStatus('synced');
                    toast.success('Successfully synced your User ID to the cloud');
                  } else {
                    console.error(`Failed to migrate local UUID to Supabase for ${savedEmail}`);
                    toast.error('Failed to sync User ID to cloud', { 
                      description: 'Your data is still stored locally' 
                    });
                  }
                } catch (syncError) {
                  console.error('Error during UUID migration to Supabase:', syncError);
                }
              }
            }
          }
        } else {
          // No saved email, check if we have a UUID in localStorage
          const localUuid = localStorage.getItem("userUuid");
          if (localUuid) {
            console.log('Found UUID in localStorage but no email');
            setUserUuid(localUuid);
            setSyncStatus('local-only');
          }
        }
      } catch (error) {
        console.error("Error checking saved UUID:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSavedUuid();
  }, [tableVerified]);

  // Generate a new UUID for the user and bind it to an email
  const generateUserUuid = async (email?: string): Promise<string> => {
    if (!email) {
      toast.error("Email is required to generate a User ID");
      return "";
    }
    
    try {
      console.log(`Generating new UUID for email: ${email}`);
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return "";
      }

      // Generate a new UUID
      const newUuid = uuidv4();
      console.log(`Generated new UUID: ${newUuid}`);
      
      // First verify the table exists
      let tableExists = false;
      
      try {
        tableExists = await ensureUuidTableExists();
        setTableVerified(tableExists);
        console.log('Table exists or was created:', tableExists);
      } catch (tableError) {
        console.error('Error ensuring table exists:', tableError);
      }
      
      // Store in Supabase if table exists
      let success = false;
      
      if (tableExists) {
        // Try to store with retries
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!success && retryCount < maxRetries) {
          console.log(`Attempt ${retryCount + 1}/${maxRetries} to store UUID in Supabase for ${email}`);
          
          try {
            success = await storeUserUuid(email, newUuid);
            
            if (success) {
              console.log(`Successfully stored UUID in Supabase for ${email}`);
              setSyncStatus('synced');
            } else {
              console.log(`Failed to store UUID in Supabase for ${email}`);
            }
          } catch (error) {
            console.error(`Error on attempt ${retryCount + 1}:`, error);
          }
          
          if (!success && retryCount < maxRetries - 1) {
            const waitTime = 1000 * (retryCount + 1);
            console.log(`Waiting ${waitTime}ms before retry ${retryCount + 2}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          retryCount++;
        }
      } else {
        console.warn('Table does not exist, skipping Supabase sync');
      }
      
      // Store locally regardless of Supabase success
      localStorage.setItem("userUuid", newUuid);
      localStorage.setItem("userEmail", email);
      
      setUserUuid(newUuid);
      setUserEmail(email);
      
      if (success) {
        toast.success(`User ID generated and linked to ${email}`);
      } else {
        setSyncStatus('local-only');
        toast.success(`User ID generated and linked to ${email} (stored locally)`, {
          description: tableExists ? "We'll try to sync with the cloud later" : "Cloud sync isn't available right now"
        });
      }
      
      return newUuid;
    } catch (error) {
      console.error("Error in generateUserUuid:", error);
      
      // Fallback to local storage if any error occurs
      const newUuid = uuidv4();
      localStorage.setItem("userUuid", newUuid);
      if (email) localStorage.setItem("userEmail", email);
      
      setUserUuid(newUuid);
      if (email) setUserEmail(email);
      setSyncStatus('local-only');
      
      toast.warning("User ID stored locally due to an error", {
        description: "Cloud sync will be attempted later"
      });
      
      return newUuid;
    }
  };

  // Force sync the current UUID to Supabase
  const forceSyncToCloud = async (): Promise<boolean> => {
    if (!userUuid || !userEmail) {
      toast.error("No User ID or email to sync");
      return false;
    }

    try {
      console.log(`Force syncing UUID ${userUuid} for ${userEmail} to cloud...`);
      
      // Verify table exists before attempting sync
      let tableExists = false;
      try {
        tableExists = await ensureUuidTableExists();
        setTableVerified(tableExists);
      } catch (tableError) {
        console.error('Error ensuring table exists during force sync:', tableError);
        toast.error("Could not verify database table");
        return false;
      }
      
      if (!tableExists) {
        toast.error("Database table doesn't exist", {
          description: "Please check your Supabase project"
        });
        return false;
      }
      
      // First check if UUID is already in Supabase
      let exists = false;
      try {
        exists = await verifyUuidInSupabase(userEmail, userUuid);
        console.log(`UUID already exists in Supabase: ${exists}`);
      } catch (verifyError) {
        console.error('Error verifying UUID existence:', verifyError);
      }
      
      if (exists) {
        toast.success("User ID is already synced to the cloud");
        setSyncStatus('synced');
        return true;
      }
      
      // If not, try to store it
      const success = await storeUserUuid(userEmail, userUuid);
      
      if (success) {
        console.log('UUID successfully synced to Supabase');
        toast.success("User ID successfully synced to the cloud");
        setSyncStatus('synced');
        return true;
      } else {
        console.error('Failed to sync UUID to Supabase');
        toast.error("Failed to sync User ID to the cloud");
        return false;
      }
    } catch (error) {
      console.error("Error forcing sync to cloud:", error);
      toast.error("Error syncing to cloud");
      return false;
    }
  };

  // Check sync status
  const checkSyncStatus = async (): Promise<boolean> => {
    if (!userUuid || !userEmail) return false;
    
    try {
      console.log(`Checking sync status for UUID ${userUuid} and email ${userEmail}...`);
      
      // First verify table exists
      let tableExists = false;
      try {
        tableExists = await ensureUuidTableExists();
        setTableVerified(tableExists);
      } catch (tableError) {
        console.error('Error verifying table exists during status check:', tableError);
        return false;
      }
      
      if (!tableExists) {
        console.log('Table does not exist, sync status is local-only');
        setSyncStatus('local-only');
        return false;
      }
      
      const isSynced = await verifyUuidInSupabase(userEmail, userUuid);
      console.log(`Sync status check result: ${isSynced ? 'synced' : 'local-only'}`);
      
      setSyncStatus(isSynced ? 'synced' : 'local-only');
      return isSynced;
    } catch (error) {
      console.error("Error checking sync status:", error);
      return false;
    }
  };

  // Check if UUID exists
  const checkUuidExists = () => {
    return !!userUuid;
  };

  // Get user email
  const getUserEmail = () => {
    return userEmail;
  };

  return {
    userUuid,
    userEmail,
    isLoading,
    syncStatus,
    generateUserUuid,
    checkUuidExists,
    getUserEmail,
    tableVerified,
    forceSyncToCloud,
    checkSyncStatus
  };
}
