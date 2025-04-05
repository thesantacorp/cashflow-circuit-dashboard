
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NotificationSettings from "../NotificationSettings";
import CurrencySelector from "../CurrencySelector";
import DataExportImport from "../DataExportImport";
import BackupManager from "../BackupManager";

interface SettingsSheetProps {
  activeSettingSheet: string | null;
  closeSettingSheet: () => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({ 
  activeSettingSheet, 
  closeSettingSheet 
}) => {
  const renderSettingContent = () => {
    switch (activeSettingSheet) {
      case "currency":
        return <CurrencySelector />;
      case "data":
        return <DataExportImport />;
      case "notifications":
        return <NotificationSettings />;
      case "backup":
        return <BackupManager onClose={closeSettingSheet} />;
      default:
        return null;
    }
  };

  // Force a controlled component pattern for the Sheet
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeSettingSheet();
    }
  };

  return (
    <Sheet 
      open={activeSettingSheet !== null} 
      onOpenChange={handleOpenChange}
    >
      <SheetContent className="w-full sm:max-w-md pt-12" hideCloseButton={true}>
        <SheetHeader>
          <SheetTitle>
            {activeSettingSheet === "currency" && "Currency Settings"}
            {activeSettingSheet === "data" && "Data Management"}
            {activeSettingSheet === "notifications" && "Notifications"}
            {activeSettingSheet === "backup" && "Google Drive Backup"}
          </SheetTitle>
        </SheetHeader>
        <div className="py-6 h-[calc(100vh-170px)] overflow-y-auto">
          {renderSettingContent()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button variant="outline" onClick={closeSettingSheet} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
