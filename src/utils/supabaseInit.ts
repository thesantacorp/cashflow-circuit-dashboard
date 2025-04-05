import { getSupabaseClient } from './supabase/client';

// Function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.getSession();
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Function to sync data to Supabase
export const syncQueue = async (queueName: string, data: any): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(queueName)
      .insert([data]);

    if (error) {
      console.error('Error syncing data to Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error syncing data to Supabase:', error);
    return false;
  }
};
