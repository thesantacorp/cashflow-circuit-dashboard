
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { register } from './serviceWorkerRegistration';
import { registerSW } from './utils/pwa';
import { Toaster } from 'sonner';
// Import the type declarations to ensure they're included in the build
import './types/google-api.d';
// Import service worker type extensions - comment out problematic import
// Types are already imported in serviceWorkerRegistration.ts

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);

// Register the enhanced PWA service worker
registerSW();

// Also register the existing service worker for backward compatibility
register({
  onSuccess: (registration) => {
    console.log('Service worker registration successful');
    console.log('App ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('New content is available');
    console.log('New version available. Close all tabs to update.');
  },
  onOffline: () => {
    console.log('You are offline. App is running in offline mode.');
  },
  onOnline: () => {
    console.log('You are back online. Your data will sync now.');
  }
});
