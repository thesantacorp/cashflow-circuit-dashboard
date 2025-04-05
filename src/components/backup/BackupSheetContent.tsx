
import React from "react";
import BackupSignInSection from "./BackupSignInSection";
import BackupSettingsSection from "./BackupSettingsSection";
import BackupActionButtons from "./BackupActionButtons";
import { BackupFrequency } from "@/types";

interface BackupSheetContentProps {
  isAuthenticated: boolean;
  settings: {
    enabled: boolean;
    frequency: BackupFrequency;
    lastBackup?: number;
  };
  isBackingUp: boolean;
  isRestoring: boolean;
  handleGoogleSignIn: () => void;
  handleGoogleSignOut: () => void;
  enableBackup: (enabled: boolean) => void;
  setBackupFrequency: (frequency: BackupFrequency) => void;
  handleBackupNow: () => void;
  handleRestoreBackup: () => void;
  onClose?: () => void;
}

const BackupSheetContent: React.FC<BackupSheetContentProps> = ({
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
    <div className="max-w-md mx-auto">
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
      
      <BackupActionButtons
        isAuthenticated={isAuthenticated}
        isBackingUp={isBackingUp}
        isRestoring={isRestoring}
        handleBackupNow={handleBackupNow}
        handleRestoreBackup={handleRestoreBackup}
      />
    </div>
  );
};

export default BackupSheetContent;
