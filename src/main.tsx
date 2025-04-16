
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { register } from './serviceWorkerRegistration';
import { Toaster } from 'sonner';
// Import the type declarations to ensure they're included in the build
import './types/google-api.d';
import { supabase } from '@/integrations/supabase/client';

// Enable realtime functionality for the app
const enableRealtime = async () => {
  try {
    // Check if realtime is already working
    const testChannel = supabase.channel('test-realtime');
    const subscription = testChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime functionality is working');
        supabase.removeChannel(testChannel);
      }
    });

    // Configure realtime to use our tables
    try {
      const { error } = await supabase.functions.invoke('init-realtime');
      if (error) {
        console.error('Error initializing realtime:', error);
      } else {
        console.log('Realtime initialization successful');
      }
    } catch (err) {
      console.error('Failed to invoke realtime initialization function:', err);
    }
  } catch (error) {
    console.error('Error testing realtime subscription:', error);
  }
};

// Run initialization on app start
enableRealtime();

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
          body: 'App is now available offline! You can view your expenses anytime.',
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
