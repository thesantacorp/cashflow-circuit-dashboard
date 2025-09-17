// PWA Service Worker Registration and Management

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Stack\'d SW: Registration successful');
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Stack\'d SW: New content available');
                // Could show a notification to refresh here
                showUpdateAvailable();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_NEEDED') {
            console.log('Stack\'d: Sync request received from SW');
            // Trigger sync in the app
            window.dispatchEvent(new CustomEvent('pwa-sync-needed', {
              detail: { timestamp: event.data.timestamp }
            }));
          }
        });

      } catch (error) {
        console.error('Stack\'d SW: Registration failed', error);
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('Stack\'d: App is online');
      notifyServiceWorkerAboutConnectivity(true);
    });

    window.addEventListener('offline', () => {
      console.log('Stack\'d: App is offline');
      notifyServiceWorkerAboutConnectivity(false);
    });
  }
};

// Notify service worker about connectivity changes
const notifyServiceWorkerAboutConnectivity = (online: boolean) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CONNECTIVITY_CHANGE',
      online
    });
  }
};

// Show update notification (can be customized)
const showUpdateAvailable = () => {
  // This could trigger a toast notification or modal
  // For now, just log it
  console.log('Stack\'d: App update available');
};

// Check if app is running as PWA
export const isPWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isWebApp = (window.navigator as any).standalone === true;
  return isStandalone || isWebApp;
};

// Get PWA display mode
export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
};