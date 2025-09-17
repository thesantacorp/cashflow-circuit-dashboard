
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerSW } from './utils/pwa';
import { Toaster } from 'sonner';
// Import the type declarations to ensure they're included in the build
import './types/google-api.d';

// Register PWA service worker
registerSW();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
    <Toaster />
  </BrowserRouter>
);
