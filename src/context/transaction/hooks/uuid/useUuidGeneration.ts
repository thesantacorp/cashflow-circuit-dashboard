
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";

interface UseUuidGenerationProps {
  setUserUuid: React.Dispatch<React.SetStateAction<string | null>>;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'local-only' | 'unknown'>>;
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
          toast.loading("Syncing your User ID to the cloud...", { id: "uuid-sync" });
          
          // Try to store with retries
          const { forceSyncToCloud } = await import('./useUuidSynchronization');
          const syncProps = {
            userUuid: newUuid,
            userEmail: email,
            setSyncStatus,
            syncRetryCount: 0,
            setSyncRetryCount: () => {},
            tableVerified: tableReady,
            setTableVerified,
            connectionVerified,
            setConnectionVerified: () => {}
          };
          const syncUtils = forceSyncToCloud(syncProps);
          const success = await syncUtils(false);
          
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

  return { generateUserUuid };
}

// For use from other hooks that need this function
export const generateUserUuidFunction = async (params: UseUuidGenerationProps & { email: string }): Promise<string> => {
  const { generateUserUuid } = useUuidGeneration(params);
  return await generateUserUuid(params.email);
};
