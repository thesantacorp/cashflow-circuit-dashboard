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
      
      console.log('PWA: Triggering install prompt manually...');
      
      // Try to show a more helpful message
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