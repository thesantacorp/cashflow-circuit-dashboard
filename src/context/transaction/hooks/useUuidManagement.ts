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
          setUserUuid(supabaseUuid);
          // Update localStorage with the Supabase UUID
          localStorage.setItem("userUuid", supabaseUuid);
        } else {
          // Fall back to localStorage UUID if no Supabase UUID
          const localUuid = localStorage.getItem("userUuid");
          if (localUuid) {
            setUserUuid(localUuid);
            // Migrate localStorage UUID to Supabase
            await storeUserUuid(savedEmail, localUuid);
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
    
    const newUuid = uuidv4();
    
    // Store in Supabase
    const success = await storeUserUuid(email, newUuid);
    
    if (!success) {
      toast.error("Failed to store User ID. Please try again.");
      return "";
    }
    
    // Keep local copy for fast access
    localStorage.setItem("userUuid", newUuid);
    localStorage.setItem("userEmail", email);
    
    setUserUuid(newUuid);
    setUserEmail(email);
    
    toast.success(`User ID generated and linked to ${email}`);
    return newUuid;
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
