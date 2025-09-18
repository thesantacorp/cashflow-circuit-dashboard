import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

const InstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  // Only show if installable and not installed
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9998]">
      <button
        onClick={installApp}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium border-0 focus:ring-2 focus:ring-orange-300 focus:outline-none touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Install Stack'd Finance App"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    </div>
  );
};

export default InstallButton;