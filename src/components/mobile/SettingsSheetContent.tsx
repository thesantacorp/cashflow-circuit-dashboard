
import React from "react";
import NotificationSettings from "../NotificationSettings";
import CurrencySelector from "../CurrencySelector";
import DataExportImport from "../DataExportImport";
import BackupManager from "../BackupManager";
import DataRecovery from "../DataRecovery";

interface SettingsSheetContentProps {
  activeSheet: string | null;
  onClose: () => void;
}

const SettingsSheetContent: React.FC<SettingsSheetContentProps> = ({ activeSheet, onClose }) => {
  switch (activeSheet) {
    case "currency":
      return <CurrencySelector />;
    case "data":
      return <DataExportImport />;
    case "notifications":
      return <NotificationSettings />;
    case "backup":
      return <BackupManager onClose={onClose} />;
    case "recovery":
      return <DataRecovery />;
    default:
      return null;
  }
};

export default SettingsSheetContent;
