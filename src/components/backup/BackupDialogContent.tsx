
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import BackupSignInSection from "./BackupSignInSection";
import BackupSettingsSection from "./BackupSettingsSection";
import BackupActionButtons from "./BackupActionButtons";
import { BackupFrequency, BackupSettings } from "@/types";

interface BackupDialogContentProps {
  isAuthenticated: boolean;
  settings: BackupSettings;
  isBackingUp: boolean;
  isRestoring: boolean;
  handleGoogleSignIn: () => void;
  handleGoogleSignOut: () => void;
  enableBackup: (enabled: boolean) => void;
  setBackupFrequency: (frequency: BackupFrequency) => void;
  handleBackupNow: () => void;
  handleRestoreBackup: () => void;
}

const BackupDialogContent: React.FC<BackupDialogContentProps> = ({
  isAuthenticated,
  settings,
  isBackingUp,
  isRestoring,
  handleGoogleSignIn,
  handleGoogleSignOut,
  enableBackup,
  setBackupFrequency,
  handleBackupNow,
  handleRestoreBackup,
}) => {
  return (
    <>
      <div className="grid gap-4 py-4">
        {!isAuthenticated ? (
          <BackupSignInSection handleGoogleSignIn={handleGoogleSignIn} />
        ) : (
          <BackupSettingsSection
            settings={settings}
            enableBackup={enableBackup}
            setBackupFrequency={setBackupFrequency}
            handleGoogleSignOut={handleGoogleSignOut}
          />
        )}
      </div>
      
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <BackupActionButtons
          isAuthenticated={isAuthenticated}
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          handleBackupNow={handleBackupNow}
          handleRestoreBackup={handleRestoreBackup}
        />
      </DialogFooter>
    </>
  );
};

export default BackupDialogContent;
