
import { supabase } from "@/integrations/supabase/client";
import { checkDatabaseConnection } from "@/utils/supabase/client";

export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // First try with the integrated client
    try {
      const { data, error } = await supabase
        .from('user_uuids')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (!error) {
        // Connection successful with integrated client
        return true;
      }
    } catch (err) {
      console.log('Integrated client check failed, trying fallback client');
    }
    
    // If that fails, try with the fallback client
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Connection verification error:", error);
    return false;
  }
}
