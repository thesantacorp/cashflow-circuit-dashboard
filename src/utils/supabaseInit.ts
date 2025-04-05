
import { ensureUuidTableExists } from './supabase';
import { toast } from 'sonner';

export async function initializeSupabase(): Promise<void> {
  try {
    // Check if the UUID table exists, create it if it doesn't
    const tableExists = await ensureUuidTableExists();
    
    if (tableExists) {
      console.log('Supabase UUID table is ready');
    } else {
      console.error('Failed to ensure UUID table exists');
      toast.error(
        'Could not connect to the database properly. Some features may not work correctly.',
        { duration: 6000 }
      );
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}
