import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

const InstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  // Don't show if installed or not installable - FOR TESTING, always show
  if (isInstalled) {
    return null;
  }

  // For testing: always show the button
  const shouldShow = true; // Change back to: !isInstalled && isInstallable;

  return (
    <div className="fixed top-6 right-6 z-[9999]">
      <button
        onClick={installApp}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 text-sm font-medium border-0 focus:ring-2 focus:ring-orange-300 focus:outline-none animate-pulse"
        aria-label="Install Stack'd Finance App"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    </div>
  );
};

export default InstallButton;