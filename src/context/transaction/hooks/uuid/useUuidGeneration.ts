
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";
import { syncQueue } from "@/utils/supabaseInit";
import { sendEmailWithUuid } from "@/utils/emailService";

interface UseUuidGenerationProps {
  setUserUuid: React.Dispatch<React.SetStateAction<string | null>>;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'syncing' | 'local-only' | 'error' | 'unknown'>>;
  userUuid: string | null;
  tableVerified: boolean;
  setTableVerified: React.Dispatch<React.SetStateAction<boolean>>;
  connectionVerified: boolean;
}

export function useUuidGeneration({
  setUserUuid,
  setUserEmail,
  setSyncStatus,
  userUuid,
  tableVerified,
  setTableVerified,
  connectionVerified
}: UseUuidGenerationProps) {
  // Generate a new UUID for the user and bind it to an email, or use an existing UUID if provided
  const generateUserUuid = async (email?: string, existingUuid?: string): Promise<string> => {
    if (!email) {
      toast.error("Email is required to generate a User ID");
      return "";
    }
    
    try {
      console.log(`${existingUuid ? 'Using existing' : 'Generating new'} UUID for email: ${email}`);
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return "";
      }

      // Generate or use existing UUID
      const newUuid = existingUuid || uuidv4();
      console.log(`${existingUuid ? 'Using' : 'Generated'} UUID: ${newUuid}`);
      
      // Show generating/importing progress
      const actionText = existingUuid ? "Importing" : "Generating";
      toast.loading(`${actionText} your User ID...`, { id: "uuid-generate" });
      
      // Store locally first to ensure we have a backup
      localStorage.setItem("userUuid", newUuid);
      localStorage.setItem("userEmail", email);
      
      // Update state immediately so UI is responsive
      setUserUuid(newUuid);
      setUserEmail(email);
      
      // Mark as local first, will update if sync succeeds
      setSyncStatus('local-only');
      
      // Send email with UUID recovery information
      try {
        await sendEmailWithUuid(email, newUuid);
        toast.success(`User ID ${existingUuid ? 'imported' : 'generated'} successfully`, { 
          id: "uuid-generate",
          description: "Your ID has been saved locally and sent to your email"
        });
      } catch (emailError) {
        console.error('Error sending UUID via email:', emailError);
        toast.warning(`User ID ${existingUuid ? 'imported' : 'generated'} successfully`, { 
          id: "uuid-generate",
          description: "Your ID has been saved locally, but we couldn't send it to your email"
        });
      }
      
      // Attempt immediate sync to Supabase
      if (connectionVerified) {
        // Check if the table exists, try to create if needed
        let tableReady = tableVerified;
        
        if (!tableVerified) {
          try {
            const { ensureUuidTableExists } = await import('@/utils/supabase/index');
            const exists = await ensureUuidTableExists();
            setTableVerified(exists);
            tableReady = exists;
          } catch (tableError) {
            console.error('Error ensuring UUID table exists:', tableError);
          }
        }
        
        if (tableReady) {
          // Show sync progress to user
          setSyncStatus('syncing');
          toast.loading("Syncing your User ID to the cloud...", { id: "uuid-sync" });
          
          // Try to store in Supabase
          try {
            const { storeUserUuid } = await import('@/utils/supabase/index');
            const success = await storeUserUuid(email, newUuid);
            
            if (success) {
              setSyncStatus('synced');
              toast.success("User ID synced to cloud", { 
                id: "uuid-sync",
                description: "Your ID is now backed up in the cloud" 
              });
            } else {
              // Add to sync queue and continue with local ID
              syncQueue.add('syncUuid', { email, uuid: newUuid });
              
              setSyncStatus('local-only');
              toast.warning("User ID stored locally", { 
                id: "uuid-sync",
                description: "Will sync to cloud when connection is available"
              });
            }
          } catch (syncError) {
            console.error('Error syncing UUID to Supabase:', syncError);
            // Add to retry queue
            syncQueue.add('syncUuid', { email, uuid: newUuid });
            
            setSyncStatus('local-only');
            toast.warning("User ID stored locally only", { 
              id: "uuid-sync",
              description: "Will sync to cloud when connection is available" 
            });
          }
        } else {
          setSyncStatus('local-only');
          console.warn('Table does not exist, skipping Supabase sync');
          toast.warning("User ID stored locally only", { 
            id: "uuid-sync",
            description: "Cloud sync will be attempted later" 
          });
        }
      } else {
        setSyncStatus('local-only');
        toast.warning(`User ID ${existingUuid ? 'imported' : 'generated'} and stored locally`, { 
          id: "uuid-sync",
          description: "No connection to cloud database" 
        });
      }
      
      return newUuid;
    } catch (error) {
      console.error("Error in generateUserUuid:", error);
      toast.error(`Error ${existingUuid ? 'importing' : 'generating'} User ID`, {
        id: "uuid-sync",
        description: "Please try again later"
      });
      return "";
    }
  };

  return { generateUserUuid };
}

// For use from other hooks that need this function
export const generateUserUuidFunction = async (params: UseUuidGenerationProps & { email: string, existingUuid?: string }): Promise<string> => {
  const { generateUserUuid } = useUuidGeneration(params);
  return await generateUserUuid(params.email, params.existingUuid);
};
