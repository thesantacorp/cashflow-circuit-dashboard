
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ConnectionStatusProps {
  connectionStatus: 'checking' | 'success' | 'error' | null;
  connectionError: string | null;
  onRetryConnection: () => void;
  isCheckingConnection: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  connectionError,
  onRetryConnection,
  isCheckingConnection
}) => {
  if (connectionStatus === 'success') {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Connection Good</AlertTitle>
        <AlertDescription className="text-green-600">
          Database connection is working properly
        </AlertDescription>
      </Alert>
    );
  }

  if (connectionError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {connectionError}
          <Button 
            variant="link" 
            onClick={onRetryConnection} 
            className="p-0 h-auto text-white underline ml-2"
            disabled={isCheckingConnection}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ConnectionStatus;
