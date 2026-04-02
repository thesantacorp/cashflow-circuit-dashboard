import { usePWA } from "@/hooks/usePWA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Globe, Share2, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

export function PWAEnforcement({ children }: { children: React.ReactNode }) {
  const { isInstallable, isStandalone, isIOS, promptInstall } = usePWA();
  const { toast } = useToast();
  const location = useLocation();

  if (isStandalone) {
    return <>{children}</>;
  }

  const ua = navigator.userAgent;
  const isAndroid = /Android/.test(ua);
  const isIOS2 = /iPad|iPhone|iPod/.test(ua);
  
  // Strict Chrome detection: must be real Chrome, not WebView or wrapped browsers
  const isRealChrome = /Chrome\//.test(ua) 
    && !/Edge|Edg|OPR|Opera|SamsungBrowser|UCBrowser|Brave|Vivaldi|YaBrowser|Silk/.test(ua)
    && !/wv\)/.test(ua) // WebView
    && !/FBAN|FBAV|Instagram|Line|Snapchat|Twitter|WhatsApp|LinkedIn|Pinterest|TikTok|Telegram/.test(ua) // In-app browsers
    && /Google Inc/.test(navigator.vendor || '');
  
  // Strict Safari detection: must be real Safari on iOS, not Chrome/Firefox/etc
  const isRealSafari = isIOS2 
    && /Safari/.test(ua) 
    && /Apple Computer/.test(navigator.vendor || '') 
    && !/CriOS|FxiOS|OPiOS|EdgiOS|FBAN|FBAV|Instagram|Line|Snapchat|Twitter|WhatsApp|LinkedIn|Pinterest|TikTok|Telegram|GSA/.test(ua);

  const isSamsung = /SamsungBrowser/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isEdge = /Edge|Edg|EdgiOS/.test(ua);
  const isOpera = /OPR|Opera|OPiOS/.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Snapchat|Twitter|WhatsApp|LinkedIn|Pinterest|TikTok|Telegram|GSA/.test(ua);
  const isBrave = /Brave/.test(ua);
  const isWebView = /wv\)/.test(ua);

  const handleInstall = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (accepted) {
        toast({
          title: "App Installing!",
          description: "The app is being installed on your device.",
        });
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast({
      title: "Link Copied!",
      description: "Paste it in the correct browser to install the app.",
    });
  };

  const getBrowserName = () => {
    if (isInAppBrowser) return "an in-app browser";
    if (isWebView) return "a WebView browser";
    if (isBrave) return "Brave";
    if (isSamsung) return "Samsung Internet";
    if (isFirefox) return "Firefox";
    if (isEdge) return "Edge";
    if (isOpera) return "Opera";
    if (isRealChrome) return "Chrome";
    if (isRealSafari) return "Safari";
    return "your current browser";
  };

  const isWrongBrowser = (isAndroid && !isRealChrome) || (isIOS && !isRealSafari);

  if (isWrongBrowser) {
    const requiredBrowser = isIOS ? "Safari" : "Google Chrome";
    const currentBrowser = getBrowserName();

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary to-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Globe className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Wrong Browser</CardTitle>
            <CardDescription>
              You're currently using {currentBrowser}. This app requires {requiredBrowser} to install properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Please open in {requiredBrowser}</p>
                <p className="text-xs text-muted-foreground">Copy the link below and paste it in {requiredBrowser}</p>
              </div>
            </div>
            <Button onClick={copyLink} className="w-full" variant="default">
              <ExternalLink className="w-4 h-4 mr-2" />
              Copy Link for {requiredBrowser}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Install App</CardTitle>
          <CardDescription>
            Install this app on your device for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isIOS && isRealSafari && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Smartphone className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Install on your iPhone</p>
                  <p className="text-sm text-muted-foreground">Follow the steps below</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tap the Share button</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Share2 className="w-3 h-3" />
                      <span>(at the bottom of Safari)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tap "Add to Home Screen"</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Plus className="w-3 h-3" />
                      <span>Scroll down to find this option</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tap "Add" to confirm</p>
                    <p className="text-xs text-muted-foreground">The app will appear on your home screen</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAndroid && isChrome && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Smartphone className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Install on your Android device</p>
                  <p className="text-sm text-muted-foreground">
                    {isInstallable ? "Tap the button below to install" : "Follow the steps to install"}
                  </p>
                </div>
              </div>
              {isInstallable ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Install App Now
                </Button>
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm mb-2">How to install:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Tap the menu (⋮) in the top right</li>
                    <li>Select "Install app"</li>
                    <li>Confirm to install the app</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {!isAndroid && !isIOS && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Globe className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Best on Mobile</p>
                  <p className="text-sm text-muted-foreground">This app is designed for mobile devices</p>
                </div>
              </div>
              {isInstallable ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">For the best experience, open this page on your mobile phone.</p>
                  <Button onClick={copyLink} variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copy Link to Share
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
