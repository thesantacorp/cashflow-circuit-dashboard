import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppMode = (window.navigator as any).standalone === true;
      setIsInstalled(isInStandaloneMode || isInWebAppMode);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: Install prompt triggered');
      // Don't prevent default - let browser show native prompt
      // e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    console.log('PWA: Install button clicked', { deferredPrompt, isInstallable });
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available. Checking PWA criteria...');
      
      // Check if we're on HTTPS
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      console.log('PWA: HTTPS check:', isHTTPS);
      
      // Check if service worker is registered
      const swRegistered = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
      console.log('PWA: Service Worker registered:', swRegistered);
      
      // Check if manifest is available
      const manifestLink = document.querySelector('link[rel="manifest"]');
      console.log('PWA: Manifest link found:', !!manifestLink);
      
      // Show iOS-specific instructions if on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        const modal = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: white; padding: 24px; border-radius: 12px; max-width: 320px; text-align: center;">
              <h3 style="margin: 0 0 16px 0;">Install Stack'd</h3>
              <p style="margin: 0 0 20px 0; line-height: 1.5;">
                <strong>Note:</strong> Please use Safari browser for the best installation experience.<br/><br/>
                Tap the Share button <span style="font-size: 24px;">⬆️</span> then select "Add to Home Screen" to install Stack'd as an app.
              </p>
              <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #FFA500; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                Got it!
              </button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        return;
      }
      
      // Try to show a more helpful message for other platforms
      const message = `To install Stack'd as an app:
      
1. Look for the install icon (⊞) in your browser's address bar
2. Or go to your browser menu → "Install Stack'd" or "Add to Home Screen"
3. On mobile: tap the share button and select "Add to Home Screen"

PWA Status:
- HTTPS: ${isHTTPS ? '✓' : '✗'}
- Service Worker: ${swRegistered ? '✓' : '✗'}
- Manifest: ${!!manifestLink ? '✓' : '✗'}`;
      
      alert(message);
      return;
    }

    try {
      console.log('PWA: Showing install prompt...');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('PWA: Installation error:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};