
import { ensureUuidTableExists } from './supabase';
import { toast } from 'sonner';

export async function initializeSupabase(): Promise<void> {
  try {
    // Check for environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || 
        !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
      toast.error(
        'Supabase configuration is missing or invalid',
        { 
          description: 'Please add your Supabase URL and anon key to .env.local file',
          duration: 10000
        }
      );
      console.error('Missing or invalid Supabase environment variables');
      return;
    }
    
    // Check if the UUID table exists, create it if it doesn't
    const tableExists = await ensureUuidTableExists();
    
    if (tableExists) {
      console.log('Supabase UUID table is ready');
      toast.success('Connected to Supabase successfully');
    } else {
      console.warn('Could not automatically create the UUID table');
      toast.warning(
        'Table setup may be needed',
        { 
          description: 'If you encounter errors, you may need to manually create the user_uuids table in Supabase',
          duration: 8000
        }
      );
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    toast.error(
      'Error connecting to Supabase',
      { 
        description: 'Please check your credentials and try again',
        duration: 6000
      }
    );
  }
}
