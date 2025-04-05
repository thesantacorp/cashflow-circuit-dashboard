
import { getSupabaseClient } from './supabase/client';
import { checkTableExists, ensureUuidTableExists } from './supabase/tableManagement';
import { ensureGrowTablesExist } from './supabase/growTableSetup';
import { storeUserUuid } from './supabase/uuidOperations';

// Define a simple queue interface for sync operations
interface SyncQueueItem {
  type: 'syncUuid';
  data: {
    email: string;
    uuid: string;
  };
}

// Create a background sync queue for network failures
class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private processing: boolean = false;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Register network status listeners
    window.addEventListener('online', () => {
      console.log('App is back online, processing sync queue...');
      this.isOnline = true;
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline, sync queue processing paused');
      this.isOnline = false;
    });
    
    // Attempt to process queue on visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        console.log('App is visible again, checking sync queue...');
        this.processQueue();
      }
    });
    
    // Try to restore queue from localStorage on initialization
    try {
      const savedQueue = localStorage.getItem('syncQueue');
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
        console.log(`Restored sync queue with ${this.queue.length} items`);
      }
    } catch (error) {
      console.error('Error restoring sync queue from localStorage:', error);
    }
  }
  
  // Add item to queue
  add(type: 'syncUuid', data: { email: string, uuid: string }): void {
    console.log(`Adding to sync queue: ${type} for ${data.email}`);
    
    // Check for duplicates to avoid redundant syncs
    const existingItem = this.queue.find(item => 
      item.type === type && 
      item.data.email === data.email &&
      item.data.uuid === data.uuid
    );
    
    if (!existingItem) {
      // Add to front of queue for newest items first
      this.queue.unshift({ type, data });
      
      // Save to localStorage for persistence across sessions
      try {
        localStorage.setItem('syncQueue', JSON.stringify(this.queue));
      } catch (error) {
        console.error('Error saving sync queue to localStorage:', error);
      }
      
      // Try to process queue if we're online
      if (this.isOnline) {
        this.processQueue();
      }
    }
  }
  
  // Process items in the queue
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.processing || this.queue.length === 0 || !this.isOnline) {
      return;
    }
    
    this.processing = true;
    console.log(`Processing sync queue with ${this.queue.length} items...`);
    
    try {
      // Process oldest items at the end of the queue first
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const item = this.queue[i];
        
        // Skip if we're offline
        if (!this.isOnline) {
          console.log('Device went offline, pausing queue processing');
          break;
        }
        
        // Process based on item type
        if (item.type === 'syncUuid') {
          const { email, uuid } = item.data;
          console.log(`Attempting to sync UUID for ${email} from queue...`);
          
          try {
            // First check if the UUID table exists
            const tableExists = await ensureUuidTableExists();
            
            if (!tableExists) {
              console.log('UUID table does not exist, will retry later');
              continue;
            }
            
            // Try to store the UUID
            const success = await storeUserUuid(email, uuid);
            
            if (success) {
              console.log(`Successfully synced UUID for ${email} from queue`);
              // Remove from queue
              this.queue.splice(i, 1);
            } else {
              console.log(`Failed to sync UUID for ${email}, will retry later`);
              // Leave in queue for retry
            }
          } catch (error) {
            console.error(`Error processing queue item for ${email}:`, error);
            // Leave in queue for retry
          }
        }
      }
      
      // Update stored queue
      localStorage.setItem('syncQueue', JSON.stringify(this.queue));
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.processing = false;
      
      // If there are still items and we're online, schedule another attempt
      if (this.queue.length > 0 && this.isOnline) {
        console.log(`${this.queue.length} items remain in sync queue, scheduling retry...`);
        setTimeout(() => this.processQueue(), 30000); // Retry in 30 seconds
      }
    }
  }
  
  // Get queue length (for UI indicators)
  getLength(): number {
    return this.queue.length;
  }
  
  // Clear queue (for testing or user-initiated actions)
  clear(): void {
    this.queue = [];
    localStorage.removeItem('syncQueue');
  }
}

// Create instance
export const syncQueue = new SyncQueue();

export const initializeSupabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing Supabase connection...');
    const supabase = getSupabaseClient();
    
    // First check that we can connect
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn('Failed to connect to Supabase');
      return false;
    }
    
    console.log('Connected to Supabase, ensuring tables exist...');
    
    // Ensure user_uuids table exists
    await ensureUuidTableExists();
    
    // Ensure grow tables exist
    await ensureGrowTablesExist();
    
    console.log('Supabase initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
};

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      // We expect PGRST116 (relation does not exist) as we're querying a non-existent table
      // If we get any other error, there might be a connection issue
      console.error('Connection test failed with error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Connection test failed with exception:', error);
    return false;
  }
};
