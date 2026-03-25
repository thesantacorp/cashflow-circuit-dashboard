import { useEffect, useMemo, useState } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const updateStandaloneState = () => {
      const standalone = mediaQuery.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    updateStandaloneState();
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', updateStandaloneState);
    window.addEventListener('focus', updateStandaloneState);
    document.addEventListener('visibilitychange', updateStandaloneState);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', updateStandaloneState);
      window.removeEventListener('focus', updateStandaloneState);
      document.removeEventListener('visibilitychange', updateStandaloneState);
    };
  }, []);

  return {
    isInstalled,
    isIOS,
    isStandalone: isInstalled,
  };
};