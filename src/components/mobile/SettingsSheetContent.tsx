
import React from "react";
import NotificationSettings from "../NotificationSettings";
import CurrencySelector from "../CurrencySelector";
import DataExportImport from "../DataExportImport";
import BackupManager from "../BackupManager";

interface SettingsSheetContentProps {
  activeSheet: string | null;
  onClose: () => void;
}

const SettingsSheetContent: React.FC<SettingsSheetContentProps> = ({ activeSheet, onClose }) => {
  // Make sure all components that might need it have access to onClose
  switch (activeSheet) {
    case "currency":
      return <CurrencySelector />;
    case "data":
      return <DataExportImport />;
    case "notifications":
      return <NotificationSettings />;
    case "backup":
      return <BackupManager onClose={onClose} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-white">
          <p className="text-lg">Select a settings option</p>
        </div>
      );
  }
};

export default SettingsSheetContent;
