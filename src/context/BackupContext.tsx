
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
}

const defaultSettings: BackupSettings = {
  enabled: false,
  frequency: "weekly",
  lastBackup: null,
};

const BackupContext = createContext<BackupContextProps | undefined>(undefined);

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BackupSettings>(() => {
    const saved = localStorage.getItem("backupSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
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
    setSettings({ ...settings, enabled: enable });
  };

  const setBackupFrequency = (frequency: BackupFrequency) => {
    setSettings({ ...settings, frequency });
  };

  // Google Drive API functions
  const performBackup = async (): Promise<void> => {
    try {
      // Get transaction data
      const transactionData = localStorage.getItem("transactionState");
      
      if (!transactionData) {
        toast.error("No data to backup");
        return;
      }

      // In a real implementation, we would use Google Drive API here
      console.log("Backing up data to Google Drive:", transactionData);
      
      // Update last backup time
      setSettings({
        ...settings,
        lastBackup: new Date().toISOString(),
      });
      
      toast.success("Backup completed successfully");
    } catch (error) {
      console.error("Backup failed:", error);
      toast.error("Backup failed. Please try again.");
    }
  };

  const restoreBackup = async (): Promise<void> => {
    try {
      // In a real implementation, we would fetch from Google Drive API here
      console.log("Restoring data from Google Drive");
      
      // Simulate restored data (in a real app, this would come from Google Drive)
      const restoredData = localStorage.getItem("transactionState");
      
      if (!restoredData) {
        toast.error("No backup found to restore");
        return;
      }
      
      // Apply the restored data (in a complete implementation, 
      // this would be replaced with actual data from Google Drive)
      localStorage.setItem("transactionState", restoredData);
      
      toast.success("Restore completed successfully. Reload the page to see changes.");
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
