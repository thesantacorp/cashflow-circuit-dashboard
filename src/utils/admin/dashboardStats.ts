
import { supabase } from "@/integrations/supabase/client";
import { getSessionStats } from "@/utils/sessionTracking";
import { formatDistanceToNow } from "date-fns";

/**
 * Fetches data for the admin dashboard
 */
export async function fetchDashboardStats() {
  // Get user count from Supabase
  const { count: userCount, error: userError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  if (userError) {
    console.error("Error fetching user count:", userError);
  }
  
  // Get session stats from local storage
  const sessionStats = getSessionStats();
  
  // Get the latest active user
  let lastActiveDate = new Date();
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (profiles && profiles.length > 0 && profiles[0].updated_at) {
      lastActiveDate = new Date(profiles[0].updated_at);
    }
  } catch (error) {
    console.error("Error fetching last active user:", error);
  }
  
  // Ensure at least one user is counted (the current user)
  const finalUserCount = (userCount !== null && userCount !== undefined) ? userCount : 1;
  
  return {
    userCount: finalUserCount,
    lastActive: formatDistanceToNow(lastActiveDate, { addSuffix: true }),
    sessions: sessionStats
  };
}

/**
 * Gets the total counts for transactions and categories from local state
 */
export function getLocalDataStats(transactions: any[], categories: any[]) {
  return {
    transactionsCount: transactions.length,
    categoriesCount: categories.length
  };
}
