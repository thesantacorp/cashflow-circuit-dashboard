import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, Copy, Check } from 'lucide-react';

type GuardState = 
  | { type: 'loading' }
  | { type: 'allowed' }
  | { type: 'wrong-browser'; message: string; recommendation: string }
  | { type: 'not-installed' };

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

const detectGuardState = async (): Promise<GuardState> => {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  const browserNavigator = navigator as NavigatorWithBrowserHints;
  const brands = browserNavigator.userAgentData?.brands?.map(({ brand }) => brand.toLowerCase()) ?? [];

  // Already running as installed PWA — always allow
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
  if (isStandalone) {
    return { type: 'allowed' };
  }

  // Allow dev/preview environments
  try {
    const host = window.location.hostname;
    if (host.startsWith('id-preview--') ||
        host.includes('localhost') ||
        host === '127.0.0.1' ||
        window.self !== window.top) {
      return { type: 'allowed' };
    }
  } catch {
    return { type: 'allowed' };
  }

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  // --- iOS: Safari only ---
  if (isIOS) {
    const isSafari = /Safari/i.test(ua)
      && /Apple/i.test(vendor)
      && !/CriOS|FxiOS|EdgiOS|EdgA|OPiOS|OPT\/|DuckDuckGo|YaBrowser|MiuiBrowser|UCBrowser|SamsungBrowser|Puffin|Focus/i.test(ua);
    if (!isSafari) {
      return {
        type: 'wrong-browser',
        message: "Please open Stack'd in Safari",
        recommendation: "Stack'd only supports Safari on iPhone and iPad.",
      };
    }
    // Safari but not installed → show install instructions
    return { type: 'not-installed' };
  }

  // --- Android: Chrome only ---
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

    if (!isChrome || hasUnsupportedBrand || hasUnsupportedToken || braveFlag) {
      return {
        type: 'wrong-browser',
        message: "Please open Stack'd in Chrome",
        recommendation: "Stack'd only supports Google Chrome on Android.",
      };
    }
    // Chrome but not installed → show install prompt
    return { type: 'not-installed' };
  }

  // --- Desktop: Chrome or Edge ---
  if (isDesktop) {
    const isChromium = /Chrome/.test(ua) || /Edg/.test(ua);
    if (!isChromium) {
      return {
        type: 'wrong-browser',
        message: "Please open Stack'd in Chrome or Edge",
        recommendation: "Stack'd needs a Chromium-based browser (Chrome or Edge) on desktop to install as a proper app.",
      };
    }
    // Chromium desktop but not installed
    return { type: 'not-installed' };
  }

  return { type: 'allowed' };
};

const CopyLinkButton: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-2 bg-muted rounded-lg p-4 active:bg-muted/70 transition-colors"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <Copy className="w-5 h-5 text-muted-foreground shrink-0" />
      )}
      <span className="text-sm font-mono text-foreground break-all text-left">
        {url}
      </span>
    </button>
  );
};

const InstallScreen: React.FC = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Download className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Install Stack'd</h1>
        <p className="text-muted-foreground leading-relaxed">
          Stack'd needs to be installed as an app before you can use it. This ensures the best experience and keeps your data secure.
        </p>

        {isIOS ? (
          <div className="bg-muted rounded-lg p-4 text-left space-y-3">
            <p className="font-semibold text-foreground">To install:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
              <li>Tap the <strong>Share</strong> button <span className="text-lg">⬆️</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right</li>
              <li>Open Stack'd from your home screen</li>
            </ol>
          </div>
        ) : (
          <div className="bg-muted rounded-lg p-4 text-left space-y-3">
            <p className="font-semibold text-foreground">To install:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
              <li>Tap the <strong>⋮</strong> menu (three dots) in Chrome</li>
              <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Install"</strong> to confirm</li>
              <li>Open Stack'd from your app drawer</li>
            </ol>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Once installed, Stack'd will appear in your app drawer and work like a native app.
        </p>
      </div>
    </div>
  );
};

const BrowserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GuardState>({ type: 'loading' });

  useEffect(() => {
    void detectGuardState().then(setState);
  }, []);

  if (state.type === 'loading') return null;

  if (state.type === 'wrong-browser') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{state.message}</h1>
          <p className="text-muted-foreground leading-relaxed">{state.recommendation}</p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tap to copy this link and paste it in the correct browser:</p>
            <CopyLinkButton />
          </div>
          <p className="text-xs text-muted-foreground">
            This ensures Stack'd installs as a true app that you can find in your app drawer and uninstall properly — not just a bookmark.
          </p>
        </div>
      </div>
    );
  }

  if (state.type === 'not-installed') {
    return <InstallScreen />;
  }

  return <>{children}</>;
};

export default BrowserGuard;
