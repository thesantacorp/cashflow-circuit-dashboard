
import React, { useEffect, useState } from "react";
import { useBackup } from "@/context/BackupContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUploadIcon } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import BackupDialogContent from "./backup/BackupDialogContent";
import BackupSheetContent from "./backup/BackupSheetContent";

interface BackupManagerProps {
  onClose?: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ onClose }) => {
  const { 
    settings, 
    enableBackup, 
    setBackupFrequency, 
    performBackup, 
    restoreBackup, 
    isBackupDue,
    isAuthenticated,
    handleGoogleSignIn,
    handleGoogleSignOut
  } = useBackup();
  
  const isMobile = useIsMobile();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const checkBackup = () => {
      if (settings.enabled && isBackupDue()) {
        toast("Backup is due", {
          description: "Your data backup is due according to your schedule",
          action: {
            label: "Backup now",
            onClick: () => performBackup(),
          },
        });
      }
    };
    
    checkBackup();
    
    const intervalId = setInterval(checkBackup, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings, isBackupDue, performBackup]);
  
  useEffect(() => {
    const autoBackup = async () => {
      if (settings.enabled && isAuthenticated && isBackupDue()) {
        try {
          await performBackup();
          toast.success("Automatic backup completed successfully");
        } catch (error) {
          console.error("Automatic backup failed:", error);
          toast.error("Automatic backup failed. We'll try again later.");
        }
      }
    };
    
    autoBackup();
    
    const intervalId = setInterval(autoBackup, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings, isAuthenticated, isBackupDue, performBackup]);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await performBackup();
      if (onClose) {
        setTimeout(onClose, 1000);
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsRestoring(true);
    try {
      await restoreBackup();
      if (onClose) {
        setTimeout(onClose, 1000);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  if (onClose) {
    return (
      <BackupSheetContent
        isAuthenticated={isAuthenticated}
        settings={settings}
        isBackingUp={isBackingUp}
        isRestoring={isRestoring}
        handleGoogleSignIn={handleGoogleSignIn}
        handleGoogleSignOut={handleGoogleSignOut}
        enableBackup={enableBackup}
        setBackupFrequency={setBackupFrequency}
        handleBackupNow={handleBackupNow}
        handleRestoreBackup={handleRestoreBackup}
        onClose={onClose}
      />
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-black bg-white flex items-center gap-2">
          <CloudUploadIcon size={16} />
          <span>{isMobile ? "" : "Backup"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Google Drive Backup</DialogTitle>
          <DialogDescription>
            Backup your transaction data to Google Drive and restore it on any device.
            Your backups are stored in a folder named "StackdBackups" in your Google Drive.
          </DialogDescription>
        </DialogHeader>
        
        <BackupDialogContent
          isAuthenticated={isAuthenticated}
          settings={settings}
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          handleGoogleSignIn={handleGoogleSignIn}
          handleGoogleSignOut={handleGoogleSignOut}
          enableBackup={enableBackup}
          setBackupFrequency={setBackupFrequency}
          handleBackupNow={handleBackupNow}
          handleRestoreBackup={handleRestoreBackup}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BackupManager;
