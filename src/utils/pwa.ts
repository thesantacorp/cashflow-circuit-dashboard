// PWA Service Worker Registration and Management

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('SW: Service worker registered successfully');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('SW: New content available');
              }
            });
          }
        });
      } catch (error) {
        console.error('SW: Service worker registration failed:', error);
      }
    });
  } else {
    console.log('SW: Service workers not supported');
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