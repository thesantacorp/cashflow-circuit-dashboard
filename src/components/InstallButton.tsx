import React from 'react';
import { usePWA } from '../hooks/usePWA';

const InstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  if (isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={installApp}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 text-sm font-semibold border-2 border-white touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Install Stack'd Finance App"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Install Stack'd
      </button>
    </div>
  );
};

export default InstallButton;