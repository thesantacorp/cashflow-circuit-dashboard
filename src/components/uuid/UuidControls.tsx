
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface UuidControlsProps {
  syncStatus: 'synced' | 'syncing' | 'local-only' | 'error' | 'unknown';
  connectionVerified: boolean;
  isSyncing: boolean;
  onSyncToCloud: () => Promise<void>;
  onVerifyStatus: () => void;
  onToggleDetails: () => void;
  showVerification: boolean;
  hasRlsIssue: boolean;
  lastCheckTime: Date | null;
  lastSyncTime: Date | null;
}

const UuidControls: React.FC<UuidControlsProps> = ({
  syncStatus,
  connectionVerified,
  isSyncing,
  onSyncToCloud,
  onVerifyStatus,
  onToggleDetails,
  showVerification,
  hasRlsIssue,
  lastCheckTime,
  lastSyncTime,
}) => {
  // Format time for display
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Never';
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
        <div>Last checked: {formatTime(lastCheckTime)}</div>
        {lastSyncTime && (
          <div>Last synced: {formatTime(lastSyncTime)}</div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {(syncStatus === 'local-only' || syncStatus === 'error') && (
          <Button
            onClick={onSyncToCloud}
            variant="outline"
            size="sm"
            disabled={isSyncing || !connectionVerified}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Sync to Cloud
              </>
            )}
          </Button>
        )}
        
        <Button
          onClick={onVerifyStatus}
          variant="outline"
          size="sm"
          disabled={!connectionVerified}
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Verify Status
        </Button>
        
        <Button
          onClick={onToggleDetails}
          variant={showVerification ? "default" : "outline"}
          size="sm"
          className={`flex-1 ${showVerification ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""} ${
            hasRlsIssue ? "border-red-400 text-red-600 hover:border-red-500" : ""
          }`}
        >
          {showVerification ? "Hide Details" : hasRlsIssue ? "Show RLS Fix Guide" : "Show Details"}
        </Button>
      </div>
      
      {!connectionVerified && (
        <Alert variant="warning" className="mt-3 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            You're currently offline. Your User ID is stored locally and will sync when your connection is restored.
          </AlertDescription>
        </Alert>
      )}
      
      <p className="text-sm text-muted-foreground mt-2">
        Your transactions are securely linked to this ID. Keep it safe for data recovery.
      </p>
    </div>
  );
};

export default UuidControls;
