import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);
    };

    checkStandalone();
    checkIOS();

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after a short delay if not in standalone mode
    const timer = setTimeout(() => {
      if (!isStandalone) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome install
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          toast.success('App installed successfully!');
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('Install prompt error:', error);
        toast.info('To install: Use your browser\'s "Add to Home Screen" option');
      }
      
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS instructions
      toast.info('Tap the Share button and then "Add to Home Screen"');
    } else {
      // Fallback for browsers that don't support PWA install
      toast.info('To install: Use your browser\'s "Add to Home Screen" option');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show if already in standalone mode
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <Card className="max-w-md mx-auto p-4 bg-card/95 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Install Stack'd</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS 
                  ? "Add to your home screen for quick access" 
                  : "Install the app for a better experience"
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="flex-1 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            {isIOS ? "Add to Home Screen" : "Install App"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Not now
          </Button>
        </div>

        {isIOS && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            Tap <span className="font-mono">Share</span> → <span className="font-mono">Add to Home Screen</span>
          </div>
        )}
      </Card>
    </div>
  );
};