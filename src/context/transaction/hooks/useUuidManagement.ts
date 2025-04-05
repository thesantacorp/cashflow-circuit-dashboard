
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { fetchUserUuid, storeUserUuid } from "@/utils/supabase";

export function useUuidManagement() {
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for saved UUID and email
  useEffect(() => {
    const checkSavedUuid = async () => {
      setIsLoading(true);
      
      // First check localStorage to maintain backward compatibility
      const savedEmail = localStorage.getItem("userEmail");
      if (savedEmail) {
        setUserEmail(savedEmail);
        
        // Try to fetch from Supabase first
        const supabaseUuid = await fetchUserUuid(savedEmail);
        
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
            // Migrate localStorage UUID to Supabase
            const success = await storeUserUuid(savedEmail, localUuid);
            if (success) {
              console.log(`Migrated local UUID to Supabase for ${savedEmail}`);
            } else {
              console.error(`Failed to migrate local UUID to Supabase for ${savedEmail}`);
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
      
      setIsLoading(false);
    };
    
    checkSavedUuid();
  }, []);

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
      
      // Store in Supabase with retry mechanism
      let success = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!success && retryCount < maxRetries) {
        success = await storeUserUuid(email, newUuid);
        
        if (!success) {
          console.log(`Retry ${retryCount + 1}/${maxRetries} storing UUID in Supabase`);
          retryCount++;
          
          // Wait a bit before retrying
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
      
      if (!success) {
        console.error("All attempts to store UUID failed");
        toast.error("Failed to store User ID. Please try again.");
        return "";
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
      toast.error("An unexpected error occurred. Please try again.");
      return "";
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
    getUserEmail
  };
}
