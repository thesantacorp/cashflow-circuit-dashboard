import { CapacitorConfig } from '@capacitor/cli';

// For live-reload against the Lovable preview during development, temporarily add:
//   server: { url: 'https://1de842c9-6fb1-4a3c-9a18-0bf0af22ba72.lovableproject.com?forceHideBadge=true', cleartext: true }
// Never ship with `server.url` set: store builds must load the bundled `dist` files.
const config: CapacitorConfig = {
  appId: 'com.cashflowcircuit.app',
  appName: 'Stackd',
  webDir: 'dist',
  plugins: {
    // Plugin configurations can be added here
  }
};

export default config;
