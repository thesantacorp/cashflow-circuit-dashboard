
import React from 'react';
import { Button } from "@/components/ui/button";
import { WifiOff, AlertTriangle, Loader2 } from "lucide-react";

interface GrowConnectionStatusProps {
  connectionStatus: 'checking' | 'online' | 'offline';
  error: string | null;
  initAttempts: number;
  isInitializing: boolean;
  onRetryConnection: () => void;
  onInitializeTables: () => void;
}

const GrowConnectionStatus: React.FC<GrowConnectionStatusProps> = ({
  connectionStatus,
  error,
  initAttempts,
  isInitializing,
  onRetryConnection,
  onInitializeTables
}) => {
  if (connectionStatus === 'offline') {
    return (
      <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-2">
          <WifiOff className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-800 font-medium">No database connection</p>
        </div>
        <p className="text-sm text-red-700 mb-3">
          Check your internet connection and make sure you can access the database.
        </p>
        <Button 
          variant="outline" 
          className="bg-white border-red-300 hover:bg-red-50"
          onClick={onRetryConnection}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (connectionStatus === 'online' && error) {
    return (
      <div className="my-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-2">
          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
          <p className="text-orange-800 font-medium">{error}</p>
        </div>
        <p className="text-sm text-orange-700 mb-3">
          {initAttempts > 1 
            ? "Multiple initialization attempts failed. The database might not be available."
            : "We'll try to create the necessary database tables."}
        </p>
        <Button 
          variant="outline"
          onClick={onInitializeTables}
          className="bg-white border-orange-300 hover:bg-orange-50"
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize & Try Again'
          )}
        </Button>
      </div>
    );
  }

  return null;
};

export default GrowConnectionStatus;
