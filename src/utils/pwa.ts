export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Register the enhanced PWA service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('PWA: Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New content available; please refresh.');
                // Show notification for app update
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Stack\'d Update Available', {
                    body: 'A new version is available. Refresh to update.',
                    icon: '/pwa-icons/icon-192x192.png'
                  });
                }
              }
            });
          }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          console.log('PWA: Notification permission:', permission);
        }

        // Show install success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          setTimeout(() => {
            new Notification('Stack\'d Ready!', {
              body: 'App is now available offline. You can track expenses anytime!',
              icon: '/pwa-icons/icon-192x192.png',
              tag: 'install-success'
            });
          }, 2000);
        }

      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    });

    // Listen for connectivity changes
    window.addEventListener('online', () => {
      console.log('PWA: Back online');
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'CONNECTIVITY_CHANGE',
            online: true
          });
        }
      });
    });

    window.addEventListener('offline', () => {
      console.log('PWA: Gone offline');
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'CONNECTIVITY_CHANGE',
            online: false
          });
        }
      });
    });
  }
};

// Check if running as PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Check if PWA is installable
export const isPWAInstallable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let isInstallable = false;
    
    const handler = (e: Event) => {
      e.preventDefault();
      isInstallable = true;
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Timeout after 3 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(isInstallable);
    }, 3000);
  });
};