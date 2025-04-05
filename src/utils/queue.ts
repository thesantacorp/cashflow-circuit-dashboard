/**
 * A simple queue implementation for storing operations that need to be retried
 * Used primarily for Supabase sync operations when network connection is spotty
 */
export class Queue {
  private items: Array<{ 
    operation: () => Promise<any>;
    retry?: number;
    maxRetries?: number;
  }> = [];
  
  private isProcessing: boolean = false;
  private maxConcurrent: number = 1;
  
  /**
   * Add an operation to the queue
   */
  enqueue(operation: () => Promise<any>, maxRetries: number = 3): void {
    this.items.push({ 
      operation,
      retry: 0,
      maxRetries
    });
    
    console.log(`Queue: Added new operation (queue length: ${this.items.length})`);
  }
  
  /**
   * Add an operation to the queue - alias for enqueue
   * This method is used in several places in the codebase
   */
  add(operationType: string, data: any, maxRetries: number = 3): void {
    const operation = async () => {
      console.log(`Queue: Processing ${operationType} operation`, data);
      
      if (operationType === 'syncUuid') {
        try {
          const { storeUserUuid } = await import('./supabase/index');
          await storeUserUuid(data.email, data.uuid);
          console.log(`Queue: Successfully synced UUID for ${data.email}`);
        } catch (error) {
          console.error(`Queue: Failed to sync UUID for ${data.email}`, error);
          throw error; // Rethrow to trigger retry logic
        }
      }
      
      // More operation types can be added here
    };
    
    this.enqueue(operation, maxRetries);
  }
  
  /**
   * Process all items in the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.items.length === 0) {
      return;
    }
    
    try {
      this.isProcessing = true;
      console.log(`Queue: Processing ${this.items.length} items`);
      
      // Process items in order
      const itemsToProcess = [...this.items];
      const successfulItems: number[] = [];
      
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        try {
          await item.operation();
          successfulItems.push(i);
          console.log(`Queue: Successfully processed item ${i}`);
        } catch (error) {
          // Update retry count
          item.retry = (item.retry || 0) + 1;
          
          if (item.retry >= (item.maxRetries || 3)) {
            // Remove item if max retries exceeded
            successfulItems.push(i);
            console.error(`Queue: Item ${i} failed and max retries exceeded. Removing from queue.`, error);
          } else {
            console.warn(`Queue: Item ${i} failed. Will retry (${item.retry}/${item.maxRetries}).`, error);
          }
        }
      }
      
      // Remove successful items (in reverse order to not affect indices)
      for (let i = successfulItems.length - 1; i >= 0; i--) {
        this.items.splice(successfulItems[i], 1);
      }
      
      console.log(`Queue: Processing complete. ${successfulItems.length} items processed, ${this.items.length} items remaining.`);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get the number of items in the queue
   */
  get size(): number {
    return this.items.length;
  }
  
  /**
   * Clear the queue
   */
  clear(): void {
    this.items = [];
    console.log('Queue cleared');
  }
}
