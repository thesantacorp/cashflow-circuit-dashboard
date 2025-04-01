
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from 'react';

// Set viewport meta tag to prevent zooming on mobile
const setViewportMeta = () => {
  // Check if the meta tag already exists
  const existingMeta = document.querySelector('meta[name="viewport"]');
  
  if (existingMeta) {
    // Update existing meta tag
    existingMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  } else {
    // Create new meta tag if it doesn't exist
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
  }
};

// Set viewport meta before rendering
setViewportMeta();

// Google API type definitions
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        setToken: (token: any) => void;
        getToken: () => any;
        drive: {
          files: {
            list: (params: any) => Promise<any>;
            create: (params: any) => Promise<any>;
            get: (params: any) => Promise<any>;
            delete: (params: any) => Promise<any>;
          };
          about: {
            get: (params: any) => Promise<any>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
