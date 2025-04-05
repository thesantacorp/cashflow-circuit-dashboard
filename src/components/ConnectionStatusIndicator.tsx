
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkSupabaseConnection } from "@/utils/supabaseInit";
import { toast } from "sonner";

interface ConnectionStatusIndicatorProps {
  className?: string;
  showControls?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  className = "", 
  showControls = false 
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    checkConnection();
    
    // Re-check when browser comes online
    const handleOnline = () => {
      toast.info("Your device is back online");
      checkConnection();
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      toast.warning("Your device is offline");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const checkConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  if (isConnected === null && !showControls) {
    return null; // Don't show anything until we know the status
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : isConnected ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      
      {showControls && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2"
          onClick={checkConnection}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
