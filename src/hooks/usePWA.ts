import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

  useEffect(() => {
    const updateStandaloneState = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    updateStandaloneState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isInstalled,
    isIOS,
    isStandalone: isInstalled,
  };
};