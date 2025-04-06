
import React from "react";
import { Button } from "@/components/ui/button";
import { CloudIcon, RefreshCw, LoaderIcon } from "lucide-react";

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
    <div className="flex justify-between border-t pt-4">
      <Button
        variant="outline"
        onClick={onSync}
        disabled={isSyncing || isCheckingConnection}
        className="border-orange-300 hover:bg-orange-50"
      >
        {isSyncing || isCheckingConnection ? (
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CloudIcon className="mr-2 h-4 w-4" />
        )}
        Sync to Cloud
      </Button>
      <Button
        variant="outline"
        onClick={onRestore}
        disabled={isSyncing || isCheckingConnection}
        className="border-orange-300 hover:bg-orange-50"
      >
        {isSyncing || isCheckingConnection ? (
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Restore Data
      </Button>
    </div>
  );
};

export default SyncActionButtons;
