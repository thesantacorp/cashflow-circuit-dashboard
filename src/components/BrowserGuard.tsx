import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type BrowserCheck = {
  allowed: boolean;
  message: string;
  recommendation: string;
};

const detectBrowser = (): BrowserCheck => {
  const ua = navigator.userAgent;
  
  // Already running as installed PWA — always allow
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
  if (isStandalone) {
    return { allowed: true, message: '', recommendation: '' };
  }

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  if (isIOS) {
    // Safari on iOS: UA contains "Safari" but NOT "CriOS" (Chrome), "FxiOS" (Firefox), "EdgiOS" (Edge), "OPiOS" (Opera)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua);
    if (!isSafari) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Safari',
        recommendation: 'Stack\'d needs Safari on iOS to install as a proper app. Copy this URL and paste it in Safari to continue.',
      };
    }
  }

  if (isAndroid) {
    // Chrome on Android: UA contains "Chrome" but NOT "EdgA" (Edge), "OPR" (Opera), "SamsungBrowser", "UCBrowser", "Firefox"
    const isChrome = /Chrome/.test(ua) && !/EdgA|OPR|SamsungBrowser|UCBrowser|Firefox|Brave/.test(ua);
    if (!isChrome) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Chrome',
        recommendation: 'Stack\'d needs Google Chrome on Android to install as a proper app. Copy this URL and paste it in Chrome to continue.',
      };
    }
  }

  if (isDesktop) {
    // On desktop, allow Chrome, Edge (Chromium-based) — they support WebAPK-like install
    const isChromium = /Chrome/.test(ua) || /Edg/.test(ua);
    if (!isChromium) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Chrome or Edge',
        recommendation: 'Stack\'d needs a Chromium-based browser (Chrome or Edge) on desktop to install as a proper app. Copy this URL and paste it in Chrome or Edge.',
      };
    }
  }

  return { allowed: true, message: '', recommendation: '' };
};

const BrowserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [check, setCheck] = useState<BrowserCheck | null>(null);

  useEffect(() => {
    setCheck(detectBrowser());
  }, []);

  // Still checking
  if (!check) return null;

  if (!check.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{check.message}</h1>
          <p className="text-muted-foreground leading-relaxed">{check.recommendation}</p>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Copy this URL:</p>
            <code className="text-sm font-mono text-foreground break-all select-all">
              {window.location.href}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            This ensures Stack'd installs as a true app that you can find in your app drawer and uninstall properly — not just a bookmark.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BrowserGuard;
