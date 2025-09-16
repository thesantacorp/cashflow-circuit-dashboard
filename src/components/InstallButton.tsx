import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

const InstallButton = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      toast.info(
        'To install: Tap the Share button and then "Add to Home Screen"',
        { duration: 5000 }
      );
    } else {
      await installApp();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <Button
        onClick={handleInstallClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 border-2 border-primary-foreground/20"
        size="lg"
      >
        {isIOS ? (
          <Smartphone className="w-5 h-5" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isIOS ? 'Add to Home Screen' : 'Install App'}
      </Button>
    </div>
  );
};

export default InstallButton;