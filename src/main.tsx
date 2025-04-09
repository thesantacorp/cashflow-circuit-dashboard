
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { register } from './serviceWorkerRegistration';
import { Toaster } from 'sonner';
// Import the type declaration file
import './types/google-api.d.ts';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Register service worker with offline/online notifications
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
