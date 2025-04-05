
import React from "react";
import { Button } from "@/components/ui/button";
import { CloudUploadIcon, RefreshCwIcon } from "lucide-react";

interface BackupActionButtonsProps {
  isAuthenticated: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  handleBackupNow: () => void;
  handleRestoreBackup: () => void;
}

const BackupActionButtons: React.FC<BackupActionButtonsProps> = ({
  isAuthenticated,
  isBackingUp,
  isRestoring,
  handleBackupNow,
  handleRestoreBackup,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Button 
        onClick={handleBackupNow} 
        className="w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600"
        disabled={!isAuthenticated || isBackingUp}
      >
        {isBackingUp ? (
          <>
            <span className="animate-spin mr-2">
              <RefreshCwIcon className="h-4 w-4" />
            </span>
            Backing up...
          </>
        ) : (
          <>
            <CloudUploadIcon className="mr-2 h-4 w-4" />
            Backup Now
          </>
        )}
      </Button>
      <Button 
        onClick={handleRestoreBackup} 
        variant="outline" 
        className="w-full sm:w-auto text-black border-orange-300 bg-white hover:bg-orange-50"
        disabled={!isAuthenticated || isRestoring}
      >
        {isRestoring ? (
          <>
            <span className="animate-spin mr-2">
              <RefreshCwIcon className="h-4 w-4" />
            </span>
            Restoring...
          </>
        ) : (
          <>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Restore Backup
          </>
        )}
      </Button>
    </div>
  );
};

export default BackupActionButtons;
