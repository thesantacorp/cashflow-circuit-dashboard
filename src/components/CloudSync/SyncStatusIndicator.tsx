
import React from "react";
import { Cloud, CloudOff, Clock } from "lucide-react";

interface SyncStatusIndicatorProps {
  syncStatus: 'synced' | 'local-only' | 'unknown';
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ syncStatus }) => {
  return (
    <div className={`flex items-center gap-2 text-sm mt-1 ${
      syncStatus === 'synced' 
        ? 'text-green-600' 
        : syncStatus === 'local-only' 
          ? 'text-amber-600' 
          : 'text-gray-500'
    }`}>
      {syncStatus === 'synced' ? (
        <>
          <Cloud className="h-4 w-4" />
          <span>Synced to cloud</span>
        </>
      ) : syncStatus === 'local-only' ? (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Stored locally only</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>Sync status unknown</span>
        </>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
