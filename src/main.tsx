
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';
// Import the type declarations to ensure they're included in the build
import './types/google-api.d';

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onNeedRefresh() {
    console.log('New version available');
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
    <Toaster />
  </BrowserRouter>
);
