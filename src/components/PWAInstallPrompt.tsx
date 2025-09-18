import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show if installable, not installed, and not dismissed
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-4 z-[9999] shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 animate-bounce" />
          <div>
            <h3 className="font-semibold">Install Stack'd Finance</h3>
            <p className="text-sm text-orange-100">Get the full app experience - works offline!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={installApp}
            className="bg-white text-orange-500 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Install Now
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 hover:bg-orange-600 rounded-lg transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;