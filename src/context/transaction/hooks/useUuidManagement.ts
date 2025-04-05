
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { fetchUserUuid, storeUserUuid, ensureUuidTableExists } from "@/utils/supabase";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableVerified, setTableVerified] = useState<boolean>(false);

  // Check for saved UUID and email
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      try {
        // First verify that the table exists
        if (!tableVerified) {
          const exists = await ensureUuidTableExists();
          setTableVerified(exists);
          
          if (!exists) {
            console.warn("UUID table does not exist or cannot be created");
          }
        }
        
        // First check localStorage to maintain backward compatibility
        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) {
          setUserEmail(savedEmail);
          
          // Try to fetch from Supabase first
          const supabaseUuid = tableVerified ? await fetchUserUuid(savedEmail) : null;
          
          if (supabaseUuid) {
            console.log(`Retrieved UUID from Supabase for ${savedEmail}`);
            setUserUuid(supabaseUuid);
            // Update localStorage with the Supabase UUID
            localStorage.setItem("userUuid", supabaseUuid);
          } else {
            // Fall back to localStorage UUID if no Supabase UUID
            const localUuid = localStorage.getItem("userUuid");
            if (localUuid) {
              setUserUuid(localUuid);
              
              // If table exists, try to migrate localStorage UUID to Supabase
              if (tableVerified) {
                const success = await storeUserUuid(savedEmail, localUuid);
                if (success) {
                  console.log(`Migrated local UUID to Supabase for ${savedEmail}`);
                } else {
                  console.error(`Failed to migrate local UUID to Supabase for ${savedEmail}`);
                }
              }
            }
          }
        } else {
          // No saved email, check if we have a UUID in localStorage
          const localUuid = localStorage.getItem("userUuid");
          if (localUuid) {
            setUserUuid(localUuid);
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
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return "";
      }

      // Generate a new UUID
      const newUuid = uuidv4();
      console.log(`Generated new UUID for ${email}: ${newUuid}`);
      
      // First verify the table exists
      const tableExists = await ensureUuidTableExists();
      setTableVerified(tableExists);
      
      // Store in Supabase if table exists
      let success = false;
      
      if (tableExists) {
        // Try to store with retries
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!success && retryCount < maxRetries) {
          console.log(`Attempt ${retryCount + 1} to store UUID in Supabase for ${email}`);
          
          try {
            success = await storeUserUuid(email, newUuid);
            
            if (success) {
              console.log(`Successfully stored UUID in Supabase for ${email} on attempt ${retryCount + 1}`);
            } else {
              console.log(`Failed to store UUID in Supabase for ${email} on attempt ${retryCount + 1}`);
            }
          } catch (error) {
            console.error(`Error on attempt ${retryCount + 1}:`, error);
          }
          
          if (!success) {
            console.log(`Retry ${retryCount + 1}/${maxRetries} storing UUID in Supabase`);
            retryCount++;
            
            // Wait a bit before retrying
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      }
      
      if (!success) {
        if (tableExists) {
          console.error("All attempts to store UUID failed");
          toast.error("Failed to store User ID. Please try again.");
        }
        
        // Last resort fallback - store locally even if Supabase fails
        localStorage.setItem("userUuid", newUuid);
        localStorage.setItem("userEmail", email);
        
        setUserUuid(newUuid);
        setUserEmail(email);
        
        if (tableExists) {
          toast.warning(
            "User ID stored locally only", 
            { description: "We'll try to sync with the cloud later" }
          );
        } else {
          toast.success(`User ID generated and linked to ${email} (local only)`);
        }
        
        return newUuid;
      }
      
      // If successful, store locally for fast access
      localStorage.setItem("userUuid", newUuid);
      localStorage.setItem("userEmail", email);
      
      setUserUuid(newUuid);
      setUserEmail(email);
      
      toast.success(`User ID generated and linked to ${email}`);
      return newUuid;
    } catch (error) {
      console.error("Error in generateUserUuid:", error);
      
      // Fallback to local storage if any error occurs
      const newUuid = uuidv4();
      localStorage.setItem("userUuid", newUuid);
      localStorage.setItem("userEmail", email || '');
      
      setUserUuid(newUuid);
      if (email) setUserEmail(email);
      
      toast.warning("User ID stored locally due to an error");
      return newUuid;
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
    generateUserUuid,
    checkUuidExists,
    getUserEmail,
    tableVerified
  };
}
