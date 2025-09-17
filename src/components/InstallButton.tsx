import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

const InstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  // Don't show if installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={installApp}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 text-sm font-medium border-0 focus:ring-2 focus:ring-orange-300 focus:outline-none"
        aria-label="Install Stack'd Finance App"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    </div>
  );
};

export default InstallButton;