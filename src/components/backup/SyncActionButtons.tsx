
import React from "react";
import { Button } from "@/components/ui/button";
import { CloudIcon, DownloadIcon, LoaderIcon, UploadIcon } from "lucide-react";

interface SyncActionButtonsProps {
  onSync: () => void;
  onRestore: () => void;
  isSyncing: boolean;
  isCheckingConnection: boolean;
}

const SyncActionButtons: React.FC<SyncActionButtonsProps> = ({
  onSync,
  onRestore,
  isSyncing,
  isCheckingConnection
}) => {
  return (
    <div className="flex flex-col sm:flex-row w-full justify-between space-y-2 sm:space-y-0 sm:space-x-2 border-t pt-4">
      <Button
        variant="outline"
        onClick={onSync}
        disabled={isSyncing || isCheckingConnection}
        className="border-orange-300 hover:bg-orange-50 w-full sm:w-auto"
        size="sm"
      >
        {isSyncing || isCheckingConnection ? (
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadIcon className="mr-2 h-4 w-4" />
        )}
        Save to Cloud
      </Button>
      <Button
        variant="outline"
        onClick={onRestore}
        disabled={isSyncing || isCheckingConnection}
        className="border-orange-300 hover:bg-orange-50 w-full sm:w-auto"
        size="sm"
      >
        {isSyncing || isCheckingConnection ? (
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="mr-2 h-4 w-4" />
        )}
        Restore from Cloud
      </Button>
    </div>
  );
};

export default SyncActionButtons;
