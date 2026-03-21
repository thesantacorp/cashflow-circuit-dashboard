import React from 'react';

// PWA install prompt is intentionally disabled.
// Installation is handled exclusively through the browser's native install flow
// (Chrome on Android / Safari on iOS) to ensure true WebAPK installation.
// No custom "Add to Home Screen" or install banners should ever appear.
const PWAInstallPrompt = () => {
  return null;
};

export default PWAInstallPrompt;