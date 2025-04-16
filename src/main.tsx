
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

// Initialize localStorage if needed with proper structure
const initializeLocalStorage = () => {
  try {
    if (!localStorage.getItem("transactionState")) {
      console.log("Initializing empty transaction state in localStorage");
      const initialState = { 
        transactions: [], 
        categories: [] 
      };
      localStorage.setItem("transactionState", JSON.stringify(initialState));
      return;
    } 
    
    // Validate existing state
    const savedStateString = localStorage.getItem("transactionState");
    if (!savedStateString) {
      throw new Error("Empty transactionState in localStorage");
    }
    
    const savedState = JSON.parse(savedStateString);
    console.log("Found existing transaction state in localStorage", savedState);
    
    // Ensure the state has the proper structure
    let modified = false;
    
    if (!Array.isArray(savedState.transactions)) {
      console.warn("Missing or invalid transactions array in localStorage, fixing structure");
      savedState.transactions = [];
      modified = true;
    }
    
    if (!Array.isArray(savedState.categories)) {
      console.warn("Missing or invalid categories array in localStorage, fixing structure");
      savedState.categories = [];
      modified = true;
    }
    
    if (modified) {
      console.log("Saving fixed transaction state structure to localStorage");
      localStorage.setItem("transactionState", JSON.stringify(savedState));
    }
    
  } catch (error) {
    console.error("Error in localStorage initialization:", error);
    // Reset to empty state on error
    const initialState = { 
      transactions: [], 
      categories: [] 
    };
    localStorage.setItem("transactionState", JSON.stringify(initialState));
  }
};

// Run initialization on app start
initializeLocalStorage();

// Add a listener for storage events to handle cross-tab synchronization
window.addEventListener('storage', (event) => {
  if (event.key === 'transactionState' && event.newValue) {
    console.log('Transaction state updated in another tab, refreshing data');
    try {
      const newState = JSON.parse(event.newValue);
      console.log('New state from storage event:', newState);
      // The state will be picked up on the next render cycle
    } catch (error) {
      console.error('Error parsing transaction state from storage event:', error);
    }
  }
});

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
