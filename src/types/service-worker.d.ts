
// Extend the ServiceWorkerRegistration interface to include the sync manager
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Add sync property to ServiceWorkerRegistration interface
interface ServiceWorkerRegistration {
  sync: SyncManager;
}
