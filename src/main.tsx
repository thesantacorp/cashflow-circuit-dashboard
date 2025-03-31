
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from 'react';

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
