
import React, { useState } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudIcon, LoaderIcon, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkDatabaseConnection } from "@/utils/supabase/client";

const BackupManager: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { isSyncing, backupToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { user, isLoading } = useAuth();
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoaderIcon className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to manage backups
        </AlertDescription>
      </Alert>
    );
  }

  const verifyConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionError(null);
    
    try {
      const isConnected = await checkDatabaseConnection();
      
      if (!isConnected) {
        setConnectionError("Could not connect to the database. Please try again later.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Connection verification error:", error);
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

  const handleBackup = async () => {
    const connectionValid = await verifyConnection();
    if (!connectionValid) return;
    
    const success = await backupToSupabase();
    if (success && onClose) {
      setTimeout(onClose, 1000);
    }
  };

  const handleRestore = async () => {
    const connectionValid = await verifyConnection();
    if (!connectionValid) return;
    
    if (window.confirm("This will replace your current data. Are you sure?")) {
      const success = await restoreFromSupabase();
      if (success && onClose) {
        toast.success("Your data has been restored successfully");
        setTimeout(onClose, 1000);
      }
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(null);
    verifyConnection();
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700">
          <CloudIcon className="mr-2 h-5 w-5" />
          Data Backup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-slate-600">
          Backup or restore your financial data to your Supabase account.
        </p>
        
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {connectionError}
              <Button 
                variant="link" 
                onClick={handleRetryConnection} 
                className="p-0 h-auto text-white underline ml-2"
                disabled={isCheckingConnection}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={handleBackup}
          disabled={isSyncing || isCheckingConnection}
          className="border-orange-300 hover:bg-orange-50"
        >
          {isSyncing || isCheckingConnection ? (
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudIcon className="mr-2 h-4 w-4" />
          )}
          Backup Now
        </Button>
        <Button
          variant="outline"
          onClick={handleRestore}
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
      </CardFooter>
    </Card>
  );
};

export default BackupManager;
