
import React from "react";
import { Cloud, CloudOff, Loader2, AlertTriangle, Shield } from "lucide-react";

interface SyncStatusBadgeProps {
  syncStatus: 'synced' | 'syncing' | 'local-only' | 'error' | 'unknown';
  hasRlsIssue: boolean;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ syncStatus, hasRlsIssue }) => {
  switch (syncStatus) {
    case 'synced':
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Cloud className="h-4 w-4" />
          <span>Synced to cloud</span>
        </div>
      );
    case 'syncing':
      return (
        <div className="flex items-center gap-2 text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Syncing to cloud...</span>
        </div>
      );
    case 'local-only':
      return (
        <div className="flex items-center gap-2 text-amber-600">
          <CloudOff className="h-4 w-4" />
          <span>Stored locally only</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-2 text-red-600">
          {hasRlsIssue ? (
            <>
              <Shield className="h-4 w-4" />
              <span>RLS policy error</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              <span>Sync error</span>
            </>
          )}
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Cloud className="h-4 w-4" />
          <span>Sync status unknown</span>
        </div>
      );
  }
};

export default SyncStatusBadge;
