
import { useState } from "react";
import { toast } from "sonner";
import { ImportStats } from "../types";

interface UseDataImportProps {
  generateUserUuid: (email: string, existingUuid?: string) => Promise<string>;
  forceSyncToCloud: (silent?: boolean) => Promise<boolean>;
}

export function useDataImport({ generateUserUuid, forceSyncToCloud }: UseDataImportProps) {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  
  const handleImport = async (email: string) => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const { fetchUserUuid } = await import('@/utils/supabase/index');
      const existingUuid = await fetchUserUuid(email);
      
      if (!existingUuid) {
        setImportError("No data found associated with this email");
        setIsImporting(false);
        return false;
      }
      
      await generateUserUuid(email, existingUuid);
      
      try {
        const { loadUserData } = await import('@/utils/userRecovery');
        const stats = await loadUserData(email, existingUuid);
        
        const syncSuccess = await forceSyncToCloud(true);
        
        if (!syncSuccess) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await forceSyncToCloud();
        }
        
        setImportStats(stats);
        setImportSuccess(true);
        
        toast.success("Data successfully imported!", {
          description: `Loaded ${stats.transactions} transactions and ${stats.categories} categories`,
          duration: 6000
        });
        
        return true;
      } catch (dataError) {
        console.error("Error importing user data:", dataError);
        
        toast.warning("User ID was restored but some data could not be imported", {
          description: "Your ID is now active for future syncing"
        });
        return false;
      }
    } catch (error) {
      console.error("Error during import:", error);
      setImportError("Unable to import your data. Please check your email and try again.");
      return false;
    } finally {
      setIsImporting(false);
    }
  };
  
  return {
    isImporting,
    importError,
    importSuccess,
    importStats,
    handleImport,
    setImportError
  };
}
