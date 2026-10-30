
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ensureStorageBucketExists } from './supabase/client';

// Function to initialize storage buckets and other resources
export const initializeStorage = async (): Promise<boolean> => {
  try {
    console.log('Initializing storage resources...');
    
    // Ensure the ideas bucket exists
    const ideasBucketExists = await ensureStorageBucketExists('ideas');
    
    if (!ideasBucketExists) {
      console.error('Failed to create ideas bucket');
      return false;
    }
    
    console.log('Storage initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    toast.error('Failed to initialize storage resources', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
};

// Try to initialize storage resources when this module is imported
initializeStorage().then(result => {
  console.log('Storage initialization result:', result);
});
