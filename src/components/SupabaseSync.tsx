
import React, { useEffect, useState } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CloudIcon, DownloadIcon, LoaderIcon, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkDatabaseConnection } from "@/utils/supabase/client";
import { supabase } from "@/integrations/supabase/client";

interface SupabaseSyncProps {
  minimal?: boolean;
}

const SupabaseSync: React.FC<SupabaseSyncProps> = ({ minimal = false }) => {
  const { isSyncing, lastSyncDate, backupToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { isLoading, user } = useAuth();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Check connection on mount
  useEffect(() => {
    if (user) {
      verifyConnection();
    }
  }, [user]);

  if (isLoading || !user) {
    return null;
  }

  const verifyConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionError(null);
    
    try {
      // First try with the integrated client
      try {
        const { data, error } = await supabase
          .from('user_uuids')
          .select('count', { count: 'exact', head: true })
          .limit(1);
        
        if (!error) {
          // Connection successful with integrated client
          setIsCheckingConnection(false);
          return true;
        }
      } catch (err) {
        console.log('Integrated client check failed, trying fallback client');
      }
      
      // If that fails, try with the fallback client
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
    setConnectionError(null);
    
    // First try with the integrated client
    try {
      const { data, error } = await supabase
        .from('user_uuids')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (!error) {
        // Connection successful with integrated client, proceed with operation
        await operation();
        return;
      }
    } catch (err) {
      console.log('Integrated client check failed, trying fallback client');
    }
    
    // If that fails, try with the fallback client
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
            onClick={() => handleOperation(backupToSupabase)} 
            disabled={isSyncing || isCheckingConnection} 
            className="flex items-center"
          >
            {isSyncing || isCheckingConnection ? (
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
          <CloudIcon className="mr-2 h-5 w-5 text-orange-500" />
          Supabase Sync
        </CardTitle>
        <CardDescription>
          Your data is automatically synced to your account and available on any device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionError && (
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
            <h4 className="text-sm font-medium">Manual Backup & Restore</h4>
            <p className="text-xs text-slate-500">
              Force a backup or restore of your data
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOperation(backupToSupabase)}
              disabled={isSyncing || isCheckingConnection}
              className="flex items-center"
            >
              {isSyncing || isCheckingConnection ? (
                <LoaderIcon className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <CloudIcon className="mr-2 h-3 w-3" />
              )}
              Backup
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOperation(restoreFromSupabase)}
              disabled={isSyncing || isCheckingConnection}
              className="flex items-center"
            >
              {isSyncing || isCheckingConnection ? (
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
