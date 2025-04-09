
import React, { createContext, useContext, useState, useEffect } from "react";
import { BackupFrequency, BackupSettings } from "@/types";
import { toast } from "sonner";
// Import the type declaration file with correct extension
import '../types/google-api.d.ts';

interface BackupContextProps {
  settings: BackupSettings;
  enableBackup: (enable: boolean) => void;
  setBackupFrequency: (frequency: BackupFrequency) => void;
  performBackup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
  isBackupDue: () => boolean;
  isAuthenticated: boolean;
  handleGoogleSignIn: () => void;
  handleGoogleSignOut: () => void;
}

const defaultSettings: BackupSettings = {
  enabled: false,
  frequency: "weekly",
  lastBackup: null,
};

const BackupContext = createContext<BackupContextProps | undefined>(undefined);

const GOOGLE_API_CLIENT_ID = "485216740467-m6npiprg02h2f8pma8doa4e3c9rp580c.apps.googleusercontent.com";

const SCOPES = "https://www.googleapis.com/auth/drive.file";

const APP_FOLDER_NAME = "StackdBackups";

// The WindowWithGAPI interface is already declared in the google-api.d.ts file
// No need to redeclare it here

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BackupSettings>(() => {
    const saved = localStorage.getItem("backupSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [gapiLoaded, setGapiLoaded] = useState<boolean>(false);
  const [gisLoaded, setGisLoaded] = useState<boolean>(false);
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  useEffect(() => {
    const loadGAPIScript = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = initGAPI;
      document.body.appendChild(script);
    };

    const loadGISScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setGisLoaded(true);
      document.body.appendChild(script);
    };

    const initGAPI = () => {
      window.gapi.load("client", async () => {
        try {
          await window.gapi.client.init({
            apiKey: null,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          });
          setGapiLoaded(true);
          
          checkAuthStatus();
        } catch (error) {
          console.error("Error initializing GAPI client:", error);
        }
      });
    };

    loadGAPIScript();
    loadGISScript();
  }, []);

  useEffect(() => {
    localStorage.setItem("backupSettings", JSON.stringify(settings));
  }, [settings]);

  const checkAuthStatus = async () => {
    if (!window.gapi || !window.google) return;
    
    try {
      const token = localStorage.getItem('gapi_access_token');
      if (token) {
        window.gapi.client.setToken({ access_token: token });
        
        await window.gapi.client.drive.about.get({ fields: 'user' });
        
        setIsAuthenticated(true);
        findOrCreateAppFolder();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth status error:", error);
      setIsAuthenticated(false);
      localStorage.removeItem('gapi_access_token');
    }
  };

  const findOrCreateAppFolder = async () => {
    if (!isAuthenticated || !window.gapi) return;

    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)'
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        setAppFolderId(files[0].id);
        console.log("Found existing app folder with ID:", files[0].id);
        return files[0].id;
      }

      const fileMetadata = {
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const createResponse = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });

      const folderId = createResponse.result.id;
      setAppFolderId(folderId);
      console.log("Created new app folder with ID:", folderId);
      return folderId;
    } catch (error) {
      console.error("Error finding/creating app folder:", error);
      toast.error("Failed to access Google Drive folder");
      return null;
    }
  };

  const isBackupDue = (): boolean => {
    if (!settings.enabled || !settings.lastBackup) return false;
    
    const lastBackup = new Date(settings.lastBackup);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (settings.frequency) {
      case "daily":
        return diffDays >= 1;
      case "weekly":
        return diffDays >= 7;
      case "monthly":
        return diffDays >= 30;
      default:
        return false;
    }
  };

  const enableBackup = (enable: boolean) => {
    if (enable && !isAuthenticated) {
      toast.error("Please sign in with Google first to enable backups");
      return;
    }
    setSettings({ ...settings, enabled: enable });
  };

  const setBackupFrequency = (frequency: BackupFrequency) => {
    setSettings({ ...settings, frequency });
  };

  const handleGoogleSignIn = async () => {
    if (!gisLoaded) {
      toast.error("Google API is still loading. Please try again in a moment.");
      return;
    }
    
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_API_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error) {
            throw new Error(response.error);
          }
          
          localStorage.setItem('gapi_access_token', response.access_token);
          
          window.gapi.client.setToken(response);
          
          setIsAuthenticated(true);
          toast.success("Successfully signed in with Google");
          
          await findOrCreateAppFolder();
        }
      });
      
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error("Google sign in failed:", error);
      toast.error("Failed to sign in with Google. Please try again.");
    }
  };

  const handleGoogleSignOut = async () => {
    if (!gisLoaded || !gapiLoaded) return;
    
    try {
      const token = window.gapi.client.getToken();
      if (token) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
          console.log('Token revoked');
        });
        window.gapi.client.setToken(null);
      }
      
      localStorage.removeItem('gapi_access_token');
      
      setIsAuthenticated(false);
      
      if (settings.enabled) {
        setSettings({ ...settings, enabled: false });
      }
      
      toast.success("Successfully signed out from Google");
    } catch (error) {
      console.error("Google sign out failed:", error);
      toast.error("Failed to sign out from Google");
    }
  };

  const performBackup = async (): Promise<void> => {
    if (!isAuthenticated) {
      toast.error("Please sign in with Google first");
      handleGoogleSignIn();
      return;
    }

    try {
      const folderId = appFolderId || await findOrCreateAppFolder();
      if (!folderId) {
        toast.error("Couldn't access Google Drive folder");
        return;
      }

      const transactionData = localStorage.getItem("transactionState");
      
      if (!transactionData) {
        toast.error("No data to backup");
        return;
      }

      const blob = new Blob([transactionData], { type: 'application/json' });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `stackd-backup-${timestamp}.json`;
      
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        parents: [folderId]
      };

      await uploadFile(blob, metadata);
      
      setSettings({
        ...settings,
        lastBackup: new Date().toISOString(),
      });
      
      toast.success("Backup completed successfully to Google Drive");
    } catch (error) {
      console.error("Backup failed:", error);
      toast.error("Backup failed. Please try again.");
    }
  };

  const uploadFile = async (blob: Blob, metadata: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const token = window.gapi.client.getToken().access_token;
      
      fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("File uploaded successfully:", data);
        resolve();
      })
      .catch(error => {
        console.error("Error uploading file:", error);
        reject(error);
      });
    });
  };

  const restoreBackup = async (): Promise<void> => {
    if (!isAuthenticated) {
      toast.error("Please sign in with Google first");
      handleGoogleSignIn();
      return;
    }

    try {
      const folderId = appFolderId || await findOrCreateAppFolder();
      if (!folderId) {
        toast.error("Couldn't access Google Drive folder");
        return;
      }

      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
        spaces: 'drive',
        orderBy: 'createdTime desc',
        fields: 'files(id, name, createdTime)'
      });

      const files = response.result.files;
      
      if (!files || files.length === 0) {
        toast.error("No backups found on Google Drive");
        return;
      }
      
      const latestFile = files[0];
      
      const fileResponse = await window.gapi.client.drive.files.get({
        fileId: latestFile.id,
        alt: 'media'
      });
      
      const backupData = fileResponse.body;
      
      if (!backupData) {
        toast.error("Failed to download backup data");
        return;
      }
      
      localStorage.setItem("transactionState", backupData);
      
      toast.success("Restore completed successfully. Reload the page to see changes.");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error("Restore failed. Please try again.");
    }
  };

  return (
    <BackupContext.Provider
      value={{
        settings,
        enableBackup,
        setBackupFrequency,
        performBackup,
        restoreBackup,
        isBackupDue,
        isAuthenticated,
        handleGoogleSignIn,
        handleGoogleSignOut
      }}
    >
      {children}
    </BackupContext.Provider>
  );
};

export const useBackup = () => {
  const context = useContext(BackupContext);
  if (context === undefined) {
    throw new Error("useBackup must be used within a BackupProvider");
  }
  return context;
};
