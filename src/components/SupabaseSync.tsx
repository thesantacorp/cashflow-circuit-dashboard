import React, { useEffect, useState } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { CloudIcon, DownloadIcon, LoaderIcon, RefreshCw, AlertCircle, WifiOff, CloudOff, UploadIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SupabaseSyncProps {
  minimal?: boolean;
}

const SupabaseSync: React.FC<SupabaseSyncProps> = ({ minimal = false }) => {
  const { isSyncing, lastSyncDate, syncToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { isLoading, user } = useAuth();
  const { isOnline, pendingSyncCount } = useTransactions();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  useEffect(() => {
    if (user && isOnline) {
      verifyConnection();
    }
  }, [user, isOnline]);

  if (isLoading || !user) {
    return null;
  }

  const verifyConnection = async () => {
    if (!isOnline) {
      setConnectionError("You are currently offline. Data will sync when you reconnect.");
      return false;
    }
    
    setIsCheckingConnection(true);
    setConnectionError(null);
    
    try {
      try {
        const { data, error } = await supabase
          .from('user_uuids')
          .select('count', { count: 'exact', head: true })
          .limit(1);
        
        if (!error) {
          setIsCheckingConnection(false);
          return true;
        }
      } catch (err) {
        console.log('Integrated client check failed, trying fallback client');
      }
      
      const isConnected = await checkDatabaseConnection();
      
      if (!isConnected) {
        setConnectionError("Could not connect to database. Please try again later.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionError(
        error instanceof Error 
          ? `Connection error: ${error.message}` 
          : "Unknown connection error"
      );
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleOperation = async (operation: () => Promise<boolean>) => {
    if (!isOnline) {
      toast("Offline", {
        description: "You are currently offline. Please connect to the internet to sync your data."
      });
      return;
    }
    
    setConnectionError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_uuids')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (!error) {
        await operation();
        return;
      }
    } catch (err) {
      console.log('Integrated client check failed, trying fallback client');
    }
    
    try {
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        setConnectionError("Could not connect to database. Please try again later.");
        return;
      }
      
      await operation();
    } catch (error) {
      console.error("Operation error:", error);
      setConnectionError(
        error instanceof Error 
          ? `Operation error: ${error.message}` 
          : "Unknown operation error"
      );
    }
  };

  if (minimal) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOperation(syncToSupabase)} 
            disabled={isSyncing || isCheckingConnection || !isOnline} 
            className="flex items-center"
          >
            {isSyncing || isCheckingConnection ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : !isOnline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <UploadIcon className="h-4 w-4" />
            )}
            <span className="ml-2">
              {!isOnline 
                ? "Offline" 
                : pendingSyncCount > 0
                ? `Save to Cloud (${pendingSyncCount})` 
                : "Save to Cloud"
              }
            </span>
          </Button>
          {lastSyncDate && isOnline && (
            <span className="text-xs text-gray-500">
              Last synced {formatDistanceToNow(lastSyncDate, { addSuffix: true })}
            </span>
          )}
          {!isOnline && (
            <span className="text-xs text-amber-500">
              Will sync when online
            </span>
          )}
        </div>
        
        {connectionError && (
          <Alert variant="destructive" className="p-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{connectionError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {isOnline ? (
            <CloudIcon className="mr-2 h-5 w-5 text-orange-500" />
          ) : (
            <CloudOff className="mr-2 h-5 w-5 text-amber-500" />
          )}
          {isOnline ? "Cloud Sync" : "Offline Mode"}
        </CardTitle>
        <CardDescription>
          {isOnline 
            ? "Your data is saved locally on your device. Use the buttons below to manually save or restore from the cloud."
            : "Currently in offline mode. Your data is saved locally and will sync when you reconnect."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOnline && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <WifiOff className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600">
              You are currently offline. Your changes are saved locally and will sync automatically when you reconnect.
              {pendingSyncCount > 0 && (
                <span className="font-medium"> ({pendingSyncCount} changes pending)</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {connectionError && isOnline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
            <Button 
              variant="link" 
              onClick={verifyConnection} 
              className="ml-2 p-0 h-auto text-white underline"
              disabled={isCheckingConnection}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium">Manual Sync & Restore</h4>
            <p className="text-xs text-slate-500">
              Save to cloud or restore your data
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOperation(() => {
                if (window.confirm('This will upload your current data to the cloud, replacing any cloud data. Continue?')) {
                  return syncToSupabase();
                }
                return Promise.resolve(false);
              })}
              disabled={isSyncing || isCheckingConnection || !isOnline}
              className="flex items-center"
            >
              {isSyncing || isCheckingConnection ? (
                <LoaderIcon className="mr-2 h-3 w-3 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="mr-2 h-3 w-3" />
              ) : (
                <UploadIcon className="mr-2 h-3 w-3" />
              )}
              Save to Cloud {pendingSyncCount > 0 && `(${pendingSyncCount})`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOperation(() => {
                if (window.confirm('This will download data from the cloud, replacing your local data. Continue?')) {
                  return restoreFromSupabase();
                }
                return Promise.resolve(false);
              })}
              disabled={isSyncing || isCheckingConnection || !isOnline}
              className="flex items-center"
            >
              {isSyncing || isCheckingConnection ? (
                <LoaderIcon className="mr-2 h-3 w-3 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="mr-2 h-3 w-3" />
              ) : (
                <DownloadIcon className="mr-2 h-3 w-3" />
              )}
              Restore from Cloud
            </Button>
          </div>
        </div>
        
        {isSyncing && isOnline && (
          <div className="flex items-center justify-center py-2 text-sm text-orange-600">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            {syncToSupabase ? "Saving your data to cloud..." : "Restoring your data from cloud..."}
          </div>
        )}
        
        {lastSyncDate && !isSyncing && isOnline && (
          <div className="text-xs text-slate-500 pt-2">
            Last sync: {lastSyncDate.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseSync;
