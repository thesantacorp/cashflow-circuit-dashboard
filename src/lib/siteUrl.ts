import { Capacitor } from '@capacitor/core';

// Public web address of the app. Auth emails link here when sent from the
// native apps, whose own origin (capacitor://localhost) can't be opened from an email.
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://stackdhq.com';

export const getAuthRedirectOrigin = () =>
  Capacitor.isNativePlatform() ? PUBLIC_SITE_URL : window.location.origin;
