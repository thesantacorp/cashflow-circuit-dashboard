
import React, { useState, useEffect } from 'react';
import { X, Download, SmartphoneIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTransactions } from '@/context/transaction';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useLocalStorage('pwa-prompt-dismissed', false);
  const [dismissedUntil, setDismissedUntil] = useLocalStorage('pwa-prompt-dismissed-until', 0);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const { isOnline } = useTransactions();

  // Show offline alert when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt and it's still within the dismissed period
    if (dismissedUntil > Date.now()) {
      setIsDismissed(true);
      return;
    } else if (dismissedUntil !== 0) {
      // Reset dismissed status if the dismissal period has expired
      setIsDismissed(false);
      setDismissedUntil(0);
    }

    // Capture the install prompt
    const captureInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
    };
  }, [dismissedUntil]);

  // App was installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the native install prompt
    await installPrompt.prompt();

    // Wait for user choice
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the A2HS prompt');
      // Dismiss for 3 days
      dismissForDays(3);
    }

    setInstallPrompt(null);
  };

  const handleDismissClick = () => {
    // Dismiss for 1 day
    dismissForDays(1);
  };

  const dismissForDays = (days: number) => {
    const dismissalPeriod = Date.now() + (days * 24 * 60 * 60 * 1000);
    setDismissedUntil(dismissalPeriod);
    setIsDismissed(true);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed || !installPrompt) {
    // But still show offline alert when necessary
    if (showOfflineAlert && !isOnline) {
      return (
        <Alert className="fixed bottom-0 left-0 right-0 z-50 m-4 border-amber-200 bg-amber-50">
          <AlertDescription className="flex items-center">
            <span className="mr-2">📱</span>
            You're in offline mode. Install our app for better offline support!
            <Button 
              variant="link" 
              className="ml-auto text-amber-800 p-0 h-auto"
              onClick={() => setShowOfflineAlert(false)}
            >
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 m-4 bg-orange-50 border-orange-200 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center">
          <SmartphoneIcon className="mr-2 h-6 w-6 text-orange-500" />
          <div className="flex-1">
            <h3 className="font-medium">Install Cashflow Circuit</h3>
            <p className="text-sm text-gray-600">Track expenses anytime, even offline!</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDismissClick}
              className="border-orange-300 text-gray-600 hover:bg-orange-100"
            >
              Later
            </Button>
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              <Download className="mr-1 h-4 w-4" /> Install
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PwaInstallPrompt;
