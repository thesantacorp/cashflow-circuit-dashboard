
import { supabase } from "@/integrations/supabase/client";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { toast } from "sonner";

export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Verifying database connection...');
    
    // First try with the integrated client
    try {
      const { data, error } = await supabase
        .from('user_uuids')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (!error) {
        // Connection successful with integrated client
        console.log('Connection verified with integrated client');
        return true;
      } else {
        console.log('Integrated client check failed:', error.message);
      }
    } catch (err) {
      console.log('Integrated client check failed:', err);
    }
    
    // If that fails, try with the fallback client
    console.log('Trying fallback client check...');
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      console.log('Fallback client check failed');
      toast.error('Database connection failed. Please check your internet connection.');
      return false;
    }
    
    console.log('Connection verified with fallback client');
    return true;
  } catch (error) {
    console.error("Connection verification error:", error);
    toast.error('Failed to connect to the database');
    return false;
  }
}
