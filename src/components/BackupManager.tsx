
import React, { useState, useEffect } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudIcon, LoaderIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { verifyDatabaseConnection } from "@/utils/connectionHelpers";
import ConnectionStatus from "@/components/backup/ConnectionStatus";
import FirstLoginAlert from "@/components/backup/FirstLoginAlert";
import SyncActionButtons from "@/components/backup/SyncActionButtons";

const BackupManager: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { isSyncing, syncToSupabase, restoreFromSupabase, isFirstLogin } = useSupabaseSync();
  const { user, isLoading } = useAuth();
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error' | null>(null);

  // Check connection on mount
  useEffect(() => {
    if (user) {
      verifyConnection();
    }
  }, [user]);

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
          You must be logged in to manage your data
        </AlertDescription>
      </Alert>
    );
  }

  const verifyConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionError(null);
    setConnectionStatus('checking');
    
    try {
      const isConnected = await verifyDatabaseConnection();
      
      if (!isConnected) {
        setConnectionError("Could not connect to the database. Please try again later.");
        setConnectionStatus('error');
        return false;
      }
      
      setConnectionStatus('success');
      return true;
    } catch (error) {
      console.error("Connection verification error:", error);
      setConnectionError(
        error instanceof Error 
          ? `Connection error: ${error.message}` 
          : "Unknown connection error"
      );
      setConnectionStatus('error');
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSync = async () => {
    const connectionValid = await verifyConnection();
    if (!connectionValid) return;
    
    if (window.confirm("This will upload your current data to the cloud. Continue?")) {
      const success = await syncToSupabase();
      if (success && onClose) {
        setTimeout(onClose, 1000);
      }
    }
  };

  const handleRestore = async () => {
    const connectionValid = await verifyConnection();
    if (!connectionValid) return;
    
    const success = await restoreFromSupabase();
    if (success && onClose) {
      toast.success("Your data has been restored successfully");
      setTimeout(onClose, 1000);
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
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-slate-600">
          Sync or restore your financial data to your cloud account.
        </p>
        
        <ConnectionStatus 
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          onRetryConnection={handleRetryConnection}
          isCheckingConnection={isCheckingConnection}
        />
        
        <FirstLoginAlert isFirstLogin={isFirstLogin} />
      </CardContent>
      <CardFooter>
        <SyncActionButtons
          onSync={handleSync}
          onRestore={handleRestore}
          isSyncing={isSyncing}
          isCheckingConnection={isCheckingConnection}
        />
      </CardFooter>
    </Card>
  );
};

export default BackupManager;
