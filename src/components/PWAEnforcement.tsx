import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Globe, Smartphone, TriangleAlert } from 'lucide-react';

import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { usePWA } from '@/hooks/usePWA';

type BrowserDetails = {
  isAndroid: boolean;
  isIOS: boolean;
  isChromeAndroid: boolean;
  isSafariIOS: boolean;
  isUnsupportedIOSBrowser: boolean;
  isUnsupportedAndroidBrowser: boolean;
};

type NavigatorWithHints = Navigator & {
  brave?: {
    isBrave?: () => Promise<boolean> | boolean;
  };
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
  };
  standalone?: boolean;
};

const BYPASS_PATH_PREFIXES = [
  '/events/',
  '/forms/',
  '/pages/',
];

const BYPASS_PATHS = new Set([
  '/auth/callback',
  '/auth/verify',
  '/auth/verification-success',
  '/auth/update-password',
]);

const CopyLinkButton = () => {
  const { copyToClipboard, hasCopied } = useClipboard();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => copyToClipboard(window.location.href)}
    >
      <Copy className="h-4 w-4" />
      {hasCopied ? 'Link copied' : 'Tap to copy link'}
    </Button>
  );
};

const detectBrowserDetails = async (): Promise<BrowserDetails> => {
  const browserNavigator = navigator as NavigatorWithHints;
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  const brands = browserNavigator.userAgentData?.brands?.map(({ brand }) => brand.toLowerCase()) ?? [];
  const brave = typeof browserNavigator.brave?.isBrave === 'function'
    ? await browserNavigator.brave.isBrave()
    : false;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/i.test(ua);
  const unsupportedAndroidTokens = /EdgA|OPR|Opera|SamsungBrowser|UCBrowser|Firefox|FxiOS|DuckDuckGo|YaBrowser|MiuiBrowser|Vivaldi/i.test(ua);
  const unsupportedIOSokens = /CriOS|FxiOS|EdgiOS|EdgA|OPiOS|OPT\/|DuckDuckGo|YaBrowser|MiuiBrowser|UCBrowser|SamsungBrowser|Puffin|Focus/i.test(ua);

  const isChromeAndroid = isAndroid && (
    brands.includes('google chrome') || (/Chrome/i.test(ua) && /Google Inc/i.test(vendor))
  ) && !unsupportedAndroidTokens && !brave;

  const isSafariIOS = isIOS
    && /Safari/i.test(ua)
    && /Apple/i.test(vendor)
    && !unsupportedIOSokens;

  return {
    isAndroid,
    isIOS,
    isChromeAndroid,
    isSafariIOS,
    isUnsupportedIOSBrowser: isIOS && !isSafariIOS,
    isUnsupportedAndroidBrowser: isAndroid && !isChromeAndroid,
  };
};

const shouldBypassEnforcement = (pathname: string) => (
  pathname.startsWith('/id-preview--')
  || BYPASS_PATHS.has(pathname)
  || BYPASS_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
);

const InstallShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4 py-6 sm:px-6">
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg items-center justify-center">
      <Card className="w-full border-border/70 bg-card/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary text-primary-foreground shadow-lg">
            <AppLogo size={38} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Install Stack'd</CardTitle>
            <CardDescription className="text-base leading-7">
              Stack'd only works after it has been launched from the installed app icon.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </div>
  </div>
);

const PWAEnforcement = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isStandalone } = usePWA();
  const [browserDetails, setBrowserDetails] = useState<BrowserDetails | null>(null);

  const isBypassed = useMemo(() => {
    try {
      const host = window.location.hostname;
      return host.startsWith('id-preview--')
        || host.includes('localhost')
        || host === '127.0.0.1'
        || window.self !== window.top
        || shouldBypassEnforcement(location.pathname);
    } catch {
      return true;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isBypassed) return;
    void detectBrowserDetails().then(setBrowserDetails);
  }, [isBypassed]);

  if (isBypassed || isStandalone) {
    return <>{children}</>;
  }

  if (!browserDetails) {
    return null;
  }

  if (browserDetails.isUnsupportedAndroidBrowser) {
    return (
      <InstallShell>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-4 w-4 text-destructive" />
            Stack'd only supports Google Chrome on Android.
          </div>
          <p className="text-muted-foreground">Open this exact link in Chrome.</p>
        </div>
        <CopyLinkButton />
      </InstallShell>
    );
  }

  if (browserDetails.isUnsupportedIOSBrowser) {
    return (
      <InstallShell>
        <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Safari is required on iPhone and iPad.
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Open this exact link in Safari.</p>
        </div>
        <CopyLinkButton />
      </InstallShell>
    );
  }

  if (browserDetails.isSafariIOS || browserDetails.isChromeAndroid) {
    return (
      <InstallShell>
        <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-primary" />
            Installation required.
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            This app is locked until it is opened from the installed app icon in {browserDetails.isChromeAndroid ? 'Chrome on Android' : 'Safari on iPhone or iPad'}.
          </p>
        </div>
        <CopyLinkButton />
      </InstallShell>
    );
  }

  return (
    <InstallShell>
      <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 text-left">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Smartphone className="h-4 w-4 text-primary" />
          Stack'd is mobile-first.
        </div>
        <p className="text-sm leading-6 text-muted-foreground">Use Chrome on Android or Safari on iPhone, install the app, then open it from the app icon.</p>
      </div>
      <CopyLinkButton />
    </InstallShell>
  );
};

export default PWAEnforcement;