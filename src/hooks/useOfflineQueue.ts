import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  type: 'transaction' | 'category';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    // Initialize from localStorage on first render
    try {
      const savedQueue = localStorage.getItem('offlineQueue');
      return savedQueue ? JSON.parse(savedQueue) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      localStorage.removeItem('offlineQueue');
      return [];
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Save queue to localStorage whenever it changes (but skip initial load)
  useEffect(() => {
    if (queue.length > 0 || localStorage.getItem('offlineQueue')) {
      localStorage.setItem('offlineQueue', JSON.stringify(queue));
    }
  }, [queue]);

  const addToQueue = useCallback((item: Omit<QueueItem, 'timestamp'>) => {
    const queueItem: QueueItem = {
      ...item,
      timestamp: Date.now()
    };
    
    setQueue(prev => {
      // Remove any existing item with same id to avoid duplicates
      const filtered = prev.filter(existing => 
        !(existing.id === item.id && existing.type === item.type)
      );
      return [...filtered, queueItem];
    });
  }, []);

  const removeFromQueue = useCallback((id: string, type: string) => {
    setQueue(prev => prev.filter(item => 
      !(item.id === id && item.type === type)
    ));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem('offlineQueue');
  }, []);

  const processQueue = useCallback(async (syncFunction: (item: QueueItem) => Promise<boolean>) => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let successCount = 0;
    let failedItems: QueueItem[] = [];

    for (const item of queue) {
      try {
        const success = await syncFunction(item);
        if (success) {
          successCount++;
        } else {
          failedItems.push(item);
        }
      } catch (error) {
        console.error(`Failed to sync ${item.type} ${item.id}:`, error);
        failedItems.push(item);
      }
    }

    // Update queue with only failed items
    setQueue(failedItems);

    if (successCount > 0) {
      toast.success(`Synced ${successCount} items to cloud`);
    }
    
    if (failedItems.length > 0) {
      toast.error(`Failed to sync ${failedItems.length} items`);
    }

    setIsProcessing(false);
  }, [queue, isProcessing]);

  return {
    queue,
    queueLength: queue.length,
    isProcessing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue
  };
}