
import { useCallback } from "react";

interface UseUuidPersistenceProps {
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setUserUuid: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'syncing' | 'local-only' | 'error' | 'unknown'>>;
  connectionVerified: boolean;
  tableVerified: boolean;
  setTableVerified: React.Dispatch<React.SetStateAction<boolean>>;
  forceSyncToCloud: (silent?: boolean) => Promise<boolean>;
}

export function useUuidPersistence({
  setUserEmail,
  setUserUuid,
  setSyncStatus,
  connectionVerified,
  tableVerified,
  setTableVerified,
  forceSyncToCloud
}: UseUuidPersistenceProps) {
  
  // Load saved UUID from localStorage and/or Supabase
  const loadSavedUuid = useCallback(async () => {
    try {
      // First check localStorage to maintain backward compatibility
      const savedEmail = localStorage.getItem("userEmail");
      if (savedEmail) {
        setUserEmail(savedEmail);
        console.log('Found email in localStorage:', savedEmail);
        
        // Try to fetch from Supabase if we have a connection
        let supabaseUuid = null;
        
        if (connectionVerified) {
          try {
            // First verify table exists
            const { ensureUuidTableExists } = await import('@/utils/supabase/index');
            const exists = await ensureUuidTableExists();
            setTableVerified(exists);
            
            if (exists) {
              const { fetchUserUuid } = await import('@/utils/supabase/index');
              supabaseUuid = await fetchUserUuid(savedEmail);
              console.log('Supabase UUID fetch result:', supabaseUuid);
            }
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
            
            // If we have a connection but couldn't fetch UUID, 
            // this local UUID needs to be synced
            if (connectionVerified && tableVerified) {
              // Don't block the UI, just schedule a sync
              setTimeout(() => {
                console.log('Scheduling background sync for local UUID');
                forceSyncToCloud(true).catch(console.error);
              }, 2000);
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
      setSyncStatus('error');
    }
  }, [connectionVerified, tableVerified, setUserEmail, setUserUuid, setSyncStatus, setTableVerified, forceSyncToCloud]);

  return { loadSavedUuid };
}
