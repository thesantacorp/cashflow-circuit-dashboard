import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Copy, ExternalLink, Globe, Plus, Share2, Smartphone, TriangleAlert } from 'lucide-react';

import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

type BrowserDetails = {
  isAndroid: boolean;
  isIOS: boolean;
  isDesktop: boolean;
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

const Step = ({ number, icon: Icon, children }: { number: number; icon: typeof Share2; children: React.ReactNode }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 text-left shadow-sm backdrop-blur">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
      {number}
    </div>
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  </div>
);

const CopyLinkButton = ({ label }: { label: string }) => {
  const { copyToClipboard, hasCopied } = useClipboard();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => copyToClipboard(window.location.href)}
    >
      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {hasCopied ? 'Link copied' : label}
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
  const isDesktop = !isIOS && !isAndroid;

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
    isDesktop,
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
              Stack'd only works when launched from the installed app icon in the supported browser flow.
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
          <p className="text-muted-foreground">Open this exact link in Chrome, then install and launch Stack'd from the app icon.</p>
        </div>
        <CopyLinkButton label="Tap to copy link for Chrome" />
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
          <p className="text-sm leading-6 text-muted-foreground">Stack'd only works when installed from Safari and opened from the app icon.</p>
        </div>
        <CopyLinkButton label="Tap to copy link for Safari" />
      </InstallShell>
    );
  }

  if (browserDetails.isSafariIOS) {
    return (
      <InstallShell>
        <div className="space-y-3">
          <Step number={1} icon={Share2}>Tap the Share button in Safari.</Step>
          <Step number={2} icon={Plus}>Choose <strong>Add to Home Screen</strong>.</Step>
          <Step number={3} icon={ExternalLink}>Tap <strong>Add</strong>, then launch Stack'd from the new app icon.</Step>
        </div>
      </InstallShell>
    );
  }

  if (browserDetails.isChromeAndroid) {
    return (
      <InstallShell>
        <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-primary" />
            Chrome native install required.
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Stack'd only works after Chrome installs it and you launch it from the app icon.
          </p>
        </div>

        <div className="space-y-3">
          <Step number={1} icon={Smartphone}>Open Chrome menu <strong>⋮</strong>.</Step>
          <Step number={2} icon={Plus}>Tap <strong>Install app</strong>. Do not use any home screen shortcut flow.</Step>
          <Step number={3} icon={ExternalLink}>After install finishes, close Chrome and launch Stack'd from the new app icon.</Step>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-left text-sm text-muted-foreground">
          If Chrome only shows <strong>Add to Home screen</strong> instead of <strong>Install app</strong>, this is still a browser shortcut flow — not the installed experience this app requires.
        </div>

        <CopyLinkButton label="Tap to copy link for Chrome" />
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
      <CopyLinkButton label="Copy link to your phone" />
    </InstallShell>
  );
};

export default PWAEnforcement;