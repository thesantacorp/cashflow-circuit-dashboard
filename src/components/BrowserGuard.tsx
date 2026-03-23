import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type BrowserCheck = {
  allowed: boolean;
  message: string;
  recommendation: string;
};

type NavigatorWithBrowserHints = Navigator & {
  brave?: {
    isBrave?: () => Promise<boolean> | boolean;
  };
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
    mobile?: boolean;
    platform?: string;
  };
};

const detectBrowser = async (): Promise<BrowserCheck> => {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  const browserNavigator = navigator as NavigatorWithBrowserHints;
  const brands = browserNavigator.userAgentData?.brands?.map(({ brand }) => brand.toLowerCase()) ?? [];
  
  // Already running as installed PWA — always allow
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
  if (isStandalone) {
    return { allowed: true, message: '', recommendation: '' };
  }

  // Allow local development and Lovable preview only
  try {
    if (window.location.hostname.startsWith('id-preview--') ||
        window.location.hostname.includes('localhost') ||
        window.location.hostname === '127.0.0.1' ||
        window.self !== window.top) {
      return { allowed: true, message: '', recommendation: '' };
    }
  } catch {
    // cross-origin iframe — allow it
    return { allowed: true, message: '', recommendation: '' };
  }

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  if (isIOS) {
    const isSafari = /Safari/i.test(ua)
      && /Apple/i.test(vendor)
      && !/CriOS|FxiOS|EdgiOS|EdgA|OPiOS|OPT\/|DuckDuckGo|YaBrowser|MiuiBrowser|UCBrowser|SamsungBrowser|Puffin|Focus/i.test(ua);
    if (!isSafari) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Safari',
        recommendation: 'Stack\'d only supports Safari on iPhone and iPad. Other iOS browsers may still show Add to Home Screen, but they do not provide the install behavior required here.',
      };
    }
  }

  if (isAndroid) {
    const brandSet = new Set(brands);
    const hasGoogleChromeBrand = brandSet.has('google chrome');
    const hasUnsupportedBrand = brands.some((brand) =>
      brand.includes('opera') ||
      brand.includes('brave') ||
      brand.includes('edge') ||
      brand.includes('samsung') ||
      brand.includes('vivaldi') ||
      brand.includes('duckduckgo')
    );
    const braveFlag = typeof browserNavigator.brave?.isBrave === 'function'
      ? await browserNavigator.brave.isBrave()
      : false;
    const hasUnsupportedToken = /EdgA|OPR|Opera|SamsungBrowser|UCBrowser|Firefox|FxiOS|DuckDuckGo|YaBrowser|MiuiBrowser|Vivaldi/i.test(ua);
    const isChromeFallback = /Chrome/i.test(ua) && /Google Inc/i.test(vendor);
    const isChrome = hasGoogleChromeBrand || (!brands.length && isChromeFallback);

    if (!isChrome) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Chrome',
        recommendation: 'Stack\'d only supports Google Chrome on Android. Other Android browsers may still show Add to Home Screen, but that is not the install flow this app supports.',
      };
    }

    if (hasUnsupportedBrand || hasUnsupportedToken || braveFlag) {
      return {
        allowed: false,
        message: 'Please open Stack\'d in Chrome',
        recommendation: 'Stack\'d only supports Google Chrome on Android. Other Android browsers may still show Add to Home Screen, but that is not the install flow this app supports.',
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
    void detectBrowser().then(setCheck);
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
