
import React, { createContext, useContext, useState, useEffect } from "react";
import { BackupFrequency, BackupSettings } from "@/types";
import { toast } from "sonner";

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

// Mock Google API functions - In a real app, these would be implemented with Google Drive API
const mockGoogleAuth = {
  signIn: async () => {
    // Simulating Google Sign-in flow
    console.log("Signing in with Google...");
    return { success: true, userId: "google-user-123" };
  },
  signOut: async () => {
    console.log("Signing out from Google...");
    return { success: true };
  },
  isSignedIn: () => {
    const savedAuth = localStorage.getItem("googleAuthStatus");
    return savedAuth ? JSON.parse(savedAuth).isSignedIn : false;
  },
};

const mockGoogleDrive = {
  createFolder: async (name: string) => {
    console.log(`Creating folder in Google Drive: ${name}`);
    return { id: "folder-123", name };
  },
  uploadFile: async (folderId: string, fileName: string, content: string) => {
    console.log(`Uploading file to Google Drive: ${fileName} in folder ${folderId}`);
    return { id: "file-123", name: fileName };
  },
  listFiles: async (folderId: string) => {
    console.log(`Listing files in folder ${folderId}`);
    return [{ id: "file-123", name: "backup.json", modifiedTime: new Date().toISOString() }];
  },
  downloadFile: async (fileId: string) => {
    console.log(`Downloading file ${fileId} from Google Drive`);
    // In this mock, we'll just return the current data from localStorage
    const data = localStorage.getItem("transactionState");
    return data;
  },
};

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BackupSettings>(() => {
    const saved = localStorage.getItem("backupSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return mockGoogleAuth.isSignedIn();
  });

  useEffect(() => {
    localStorage.setItem("backupSettings", JSON.stringify(settings));
  }, [settings]);

  // Check if backup is due based on frequency
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
    try {
      const response = await mockGoogleAuth.signIn();
      if (response.success) {
        setIsAuthenticated(true);
        localStorage.setItem("googleAuthStatus", JSON.stringify({ isSignedIn: true, userId: response.userId }));
        toast.success("Successfully signed in with Google");
        
        // Create app folder in Google Drive if it doesn't exist
        await mockGoogleDrive.createFolder("CashFlowBackups");
      }
    } catch (error) {
      console.error("Google sign in failed:", error);
      toast.error("Failed to sign in with Google. Please try again.");
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await mockGoogleAuth.signOut();
      setIsAuthenticated(false);
      localStorage.setItem("googleAuthStatus", JSON.stringify({ isSignedIn: false }));
      
      // If backup was enabled, disable it
      if (settings.enabled) {
        setSettings({ ...settings, enabled: false });
      }
      
      toast.success("Successfully signed out from Google");
    } catch (error) {
      console.error("Google sign out failed:", error);
      toast.error("Failed to sign out from Google");
    }
  };

  // Google Drive API functions
  const performBackup = async (): Promise<void> => {
    if (!isAuthenticated) {
      toast.error("Please sign in with Google first");
      handleGoogleSignIn();
      return;
    }

    try {
      // Get transaction data
      const transactionData = localStorage.getItem("transactionState");
      
      if (!transactionData) {
        toast.error("No data to backup");
        return;
      }

      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `cashflow-backup-${timestamp}.json`;
      
      // Upload to Google Drive
      await mockGoogleDrive.uploadFile("CashFlowBackups", filename, transactionData);
      
      // Update last backup time
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

  const restoreBackup = async (): Promise<void> => {
    if (!isAuthenticated) {
      toast.error("Please sign in with Google first");
      handleGoogleSignIn();
      return;
    }

    try {
      // Get list of backup files
      const files = await mockGoogleDrive.listFiles("CashFlowBackups");
      
      if (files.length === 0) {
        toast.error("No backups found on Google Drive");
        return;
      }
      
      // Get the most recent file
      const latestFile = files[0];
      
      // Download the file
      const backupData = await mockGoogleDrive.downloadFile(latestFile.id);
      
      if (!backupData) {
        toast.error("Failed to download backup data");
        return;
      }
      
      // Apply the restored data
      localStorage.setItem("transactionState", backupData);
      
      toast.success("Restore completed successfully. Reload the page to see changes.");
      
      // Reload the page to apply changes
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
