
import { useCallback } from "react";
import { SyncBaseProps } from "./types";

export function useSyncUtils({
  tableVerified,
  connectionVerified,
  setConnectionVerified,
  setTableVerified
}: SyncBaseProps) {
  
  // Verify Supabase setup (connection and table)
  const verifySetup = useCallback(async () => {
    try {
      // Verify Supabase connection and table existence
      const result = {
        success: false,
        errorMessage: "",
        errorDescription: ""
      };

      // First check connection if not already verified
      if (!connectionVerified) {
        const { verifySupabaseSetup } = await import('@/utils/supabaseVerification');
        const verification = await verifySupabaseSetup();
        setConnectionVerified(verification.connected);
        setTableVerified(verification.tableExists);
        
        if (!verification.connected) {
          console.log('No connection to Supabase during verification');
          result.errorMessage = "Cannot connect to cloud database";
          result.errorDescription = "Your data will be stored locally";
          return result;
        }
      }
      
      // Then check table existence if not already verified
      let tableExists = tableVerified;
      if (!tableExists) {
        try {
          const { ensureUuidTableExists } = await import('@/utils/supabase/index');
          tableExists = await ensureUuidTableExists();
          setTableVerified(tableExists);
        } catch (tableError) {
          console.error('Error ensuring table exists during setup verification:', tableError);
          result.errorMessage = "Could not verify database table";
          result.errorDescription = "Please check your connection";
          return result;
        }
      }
      
      if (!tableExists) {
        console.log('Table does not exist during verification');
        result.errorMessage = "Database table doesn't exist";
        result.errorDescription = "Please check your Supabase project";
        return result;
      }
      
      result.success = true;
      return result;
    } catch (error) {
      console.error("Error verifying Supabase setup:", error);
      return {
        success: false,
        errorMessage: "Unexpected error during verification",
        errorDescription: "Please try again later" 
      };
    }
  }, [connectionVerified, tableVerified, setConnectionVerified, setTableVerified]);

  return { verifySetup };
}
