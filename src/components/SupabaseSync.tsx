
import React from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CloudIcon, DownloadIcon, LoaderIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface SupabaseSyncProps {
  minimal?: boolean;
}

const SupabaseSync: React.FC<SupabaseSyncProps> = ({ minimal = false }) => {
  const { isSyncing, lastSyncDate, backupToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { isLoading, user } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  if (minimal) {
    return (
      <div className="flex items-center space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => backupToSupabase()} 
          disabled={isSyncing} 
          className="flex items-center"
        >
          {isSyncing ? (
            <LoaderIcon className="h-4 w-4 animate-spin" />
          ) : (
            <CloudIcon className="h-4 w-4" />
          )}
          <span className="ml-2">Sync Data</span>
        </Button>
        {lastSyncDate && (
          <span className="text-xs text-gray-500">
            Last synced {formatDistanceToNow(lastSyncDate, { addSuffix: true })}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CloudIcon className="mr-2 h-5 w-5 text-orange-500" />
          Supabase Sync
        </CardTitle>
        <CardDescription>
          Your data is automatically synced to your account and available on any device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium">Manual Backup & Restore</h4>
            <p className="text-xs text-slate-500">
              Force a backup or restore of your data
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => backupToSupabase()}
              disabled={isSyncing}
              className="flex items-center"
            >
              {isSyncing ? (
                <LoaderIcon className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <CloudIcon className="mr-2 h-3 w-3" />
              )}
              Backup
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => restoreFromSupabase()}
              disabled={isSyncing}
              className="flex items-center"
            >
              {isSyncing ? (
                <LoaderIcon className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <DownloadIcon className="mr-2 h-3 w-3" />
              )}
              Restore
            </Button>
          </div>
        </div>
        
        {isSyncing && (
          <div className="flex items-center justify-center py-2 text-sm text-orange-600">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Syncing your data...
          </div>
        )}
        
        {lastSyncDate && !isSyncing && (
          <div className="text-xs text-slate-500 pt-2">
            Last sync: {lastSyncDate.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseSync;
