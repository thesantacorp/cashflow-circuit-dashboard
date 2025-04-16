
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { register } from './serviceWorkerRegistration';
import { Toaster } from 'sonner';
// Import the type declarations to ensure they're included in the build
import './types/google-api.d';
// Import service worker type extensions - comment out problematic import
// Types are already imported in serviceWorkerRegistration.ts

// Initialize localStorage if needed
const initializeLocalStorage = () => {
  if (!localStorage.getItem("transactionState")) {
    console.log("Initializing empty transaction state in localStorage");
    localStorage.setItem("transactionState", JSON.stringify({ 
      transactions: [], 
      categories: [] 
    }));
  } else {
    console.log("Found existing transaction state in localStorage");
  }
};

// Run initialization
initializeLocalStorage();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);

// Register service worker with enhanced offline/online notifications
register({
  onSuccess: (registration) => {
    console.log('Service worker registration successful');
    console.log('App ready for offline use');
    
    // Notify user that the app is available offline
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Cashflow Circuit', {
          body: 'App is now available offline! You can record expenses anytime.',
          icon: '/app-icon.png'
        });
      });
    }
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
