
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { 
  fetchUserUuid, 
  storeUserUuid, 
  ensureUuidTableExists, 
  verifyUuidInSupabase,
  getSupabaseClient 
} from "@/utils/supabase/index";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableVerified, setTableVerified] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local-only' | 'unknown'>('unknown');
  const [syncRetryCount, setSyncRetryCount] = useState<number>(0);
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);

  // Verify database connection on mount
  useEffect(() => {
    const verifyDatabase = async () => {
      try {
        // Use our new comprehensive verification
        const verification = await verifySupabaseSetup();
        console.log('Comprehensive Supabase verification:', verification);
        
        setTableVerified(verification.tableExists);
        setConnectionVerified(verification.connected);
        
        if (verification.connected && verification.tableExists) {
          console.log('Supabase is fully set up and ready for UUID management');
        } else if (verification.connected) {
          console.warn('Connected to Supabase but table may not be ready');
        } else {
          console.error('Cannot connect to Supabase');
        }
      } catch (error) {
        console.warn('Could not verify Supabase connection:', error);
      }
    };
    
    verifyDatabase();
  }, []);

  // Auto-sync UUID on app load if needed
  useEffect(() => {
    const autoSyncUuid = async () => {
      if (userUuid && userEmail && syncStatus === 'local-only' && tableVerified) {
        console.log('Attempting automatic sync of local UUID to cloud...');
        await forceSyncToCloud(true);
      }
    };

    if (tableVerified && userUuid && userEmail) {
      autoSyncUuid();
    }
  }, [tableVerified, userUuid, userEmail, syncStatus]);

  // Check for saved UUID and email
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      try {
        // First verify that the table exists
        if (!tableVerified && connectionVerified) {
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
              
              // If table exists, try to migrate localStorage UUID to Supabase immediately
              if (tableVerified) {
                try {
                  console.log(`Attempting to sync local UUID ${localUuid} to Supabase for ${savedEmail}`);
                  await forceSyncToCloud(true);
                } catch (syncError) {
                  console.error('Error during initial UUID sync to Supabase:', syncError);
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
  }, [tableVerified, connectionVerified]);

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
      
      // Store locally first to ensure we have a backup
      localStorage.setItem("userUuid", newUuid);
      localStorage.setItem("userEmail", email);
      
      setUserUuid(newUuid);
      setUserEmail(email);
      
      // Attempt immediate sync to Supabase
      if (connectionVerified) {
        // Check if the table exists, try to create if needed
        let tableReady = tableVerified;
        
        if (!tableVerified) {
          try {
            const exists = await ensureUuidTableExists();
            setTableVerified(exists);
            tableReady = exists;
          } catch (tableError) {
            console.error('Error ensuring UUID table exists:', tableError);
          }
        }
        
        if (tableReady) {
          // Show sync progress to user
          toast.loading("Syncing your User ID to the cloud...", { id: "uuid-sync" });
          
          // Try to store with retries
          const success = await forceSyncToCloud(false);
          
          if (success) {
            setSyncStatus('synced');
            toast.success(`User ID generated and synced to cloud`, { id: "uuid-sync" });
          } else {
            setSyncStatus('local-only');
            toast.error(`Failed to sync to cloud`, { 
              id: "uuid-sync",
              description: "Your ID is stored locally. We'll try again later." 
            });
          }
        } else {
          setSyncStatus('local-only');
          console.warn('Table does not exist, skipping Supabase sync');
          toast.warning(`User ID stored locally only`, { 
            id: "uuid-sync",
            description: "Cloud sync will be attempted later" 
          });
        }
      } else {
        setSyncStatus('local-only');
        toast.warning(`User ID generated and stored locally`, { 
          id: "uuid-sync",
          description: "No connection to cloud database" 
        });
      }
      
      return newUuid;
    } catch (error) {
      console.error("Error in generateUserUuid:", error);
      toast.error("Error generating User ID", {
        id: "uuid-sync",
        description: "Please try again later"
      });
      return "";
    }
  };

  // Force sync the current UUID to Supabase
  const forceSyncToCloud = useCallback(async (silent: boolean = false): Promise<boolean> => {
    if (!userUuid || !userEmail) {
      if (!silent) toast.error("No User ID or email to sync");
      return false;
    }

    try {
      console.log(`Force syncing UUID ${userUuid} for ${userEmail} to cloud...`);
      
      if (!silent) {
        toast.loading("Syncing to cloud...", { id: "force-sync" });
      }
      
      // Verify Supabase connection
      if (!connectionVerified) {
        const verification = await verifySupabaseSetup();
        setConnectionVerified(verification.connected);
        setTableVerified(verification.tableExists);
        
        if (!verification.connected) {
          if (!silent) toast.error("Cannot connect to cloud database", { id: "force-sync" });
          return false;
        }
      }
      
      // Verify table exists before attempting sync
      let tableExists = tableVerified;
      if (!tableExists) {
        try {
          tableExists = await ensureUuidTableExists();
          setTableVerified(tableExists);
        } catch (tableError) {
          console.error('Error ensuring table exists during force sync:', tableError);
          if (!silent) toast.error("Could not verify database table", { id: "force-sync" });
          return false;
        }
      }
      
      if (!tableExists) {
        if (!silent) {
          toast.error("Database table doesn't exist", {
            id: "force-sync",
            description: "Please check your Supabase project"
          });
        }
        return false;
      }
      
      // First check if UUID is already in Supabase
      let exists = false;
      try {
        exists = await verifyUuidInSupabase(userEmail, userUuid);
        console.log(`UUID already exists in Supabase: ${exists}`);
        
        if (exists) {
          setSyncStatus('synced');
          if (!silent) toast.success("User ID is already synced to the cloud", { id: "force-sync" });
          return true;
        }
      } catch (verifyError) {
        console.error('Error verifying UUID existence:', verifyError);
      }
      
      // If not, try to store it with retries
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!success && attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1}/${maxAttempts} to sync UUID to Supabase`);
          success = await storeUserUuid(userEmail, userUuid);
          
          if (success) {
            console.log('UUID successfully synced to Supabase');
            setSyncStatus('synced');
            if (!silent) toast.success("User ID successfully synced to the cloud", { id: "force-sync" });
            return true;
          }
        } catch (syncError) {
          console.error(`Error on sync attempt ${attempts + 1}:`, syncError);
        }
        
        if (!success && attempts < maxAttempts - 1) {
          const delay = 1000 * (attempts + 1);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        attempts++;
      }
      
      setSyncRetryCount(prevCount => prevCount + 1);
      
      if (!success) {
        console.error('Failed to sync UUID to Supabase after multiple attempts');
        if (!silent) toast.error("Failed to sync User ID to the cloud", { id: "force-sync" });
        setSyncStatus('local-only');
        
        // Schedule another retry attempt later
        if (syncRetryCount < 5) {
          const retryDelay = 5000 * (syncRetryCount + 1);
          console.log(`Scheduling another retry in ${retryDelay}ms`);
          setTimeout(() => forceSyncToCloud(true), retryDelay);
        }
        
        return false;
      }
      
      return success;
    } catch (error) {
      console.error("Error forcing sync to cloud:", error);
      if (!silent) toast.error("Error syncing to cloud", { id: "force-sync" });
      return false;
    }
  }, [userUuid, userEmail, tableVerified, connectionVerified, syncRetryCount]);

  // Check sync status
  const checkSyncStatus = useCallback(async (): Promise<boolean> => {
    if (!userUuid || !userEmail) return false;
    
    try {
      console.log(`Checking sync status for UUID ${userUuid} and email ${userEmail}...`);
      
      // First verify connection and table
      if (!connectionVerified || !tableVerified) {
        const verification = await verifySupabaseSetup();
        setConnectionVerified(verification.connected);
        setTableVerified(verification.tableExists);
        
        if (!verification.connected) {
          console.log('No connection to Supabase, sync status is local-only');
          setSyncStatus('local-only');
          return false;
        }
        
        if (!verification.tableExists) {
          console.log('Table does not exist, sync status is local-only');
          setSyncStatus('local-only');
          return false;
        }
      }
      
      const isSynced = await verifyUuidInSupabase(userEmail, userUuid);
      console.log(`Sync status check result: ${isSynced ? 'synced' : 'local-only'}`);
      
      setSyncStatus(isSynced ? 'synced' : 'local-only');
      
      // If not synced, attempt to sync now
      if (!isSynced) {
        console.log('UUID not synced to Supabase, attempting sync now...');
        await forceSyncToCloud(true);
      }
      
      return isSynced;
    } catch (error) {
      console.error("Error checking sync status:", error);
      return false;
    }
  }, [userUuid, userEmail, connectionVerified, tableVerified, forceSyncToCloud]);

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
