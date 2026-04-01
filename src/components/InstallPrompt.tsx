import { useEffect, useState } from 'react';

let deferredPrompt: any = null;

export default function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      setCanInstall(false);
    }
  };

  if (installed || !canInstall) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '16px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
        Install this app on your device
      </span>
      <button
        onClick={handleInstall}
        style={{
          background: '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Install
      </button>
    </div>
  );
}