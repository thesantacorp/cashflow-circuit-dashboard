
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Cloud, CloudOff, Loader2, AlertTriangle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime, connectionVerified, forceSyncToCloud } = useTransactions();
  const [showExtended, setShowExtended] = useState(false);
  const [timeSinceSync, setTimeSinceSync] = useState<string>("calculating...");
  
  // Format the last sync time for display
  const formatSyncTime = () => {
    if (!lastSyncTime) return "Never synced";
    
    // If it was today, just show the time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const syncDate = new Date(lastSyncTime);
    
    if (syncDate >= today) {
      return `Today at ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it was yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (syncDate >= yesterday) {
      return `Yesterday at ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show the full date
    return syncDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calculate time since last sync
  useEffect(() => {
    if (!lastSyncTime) {
      setTimeSinceSync("never");
      return;
    }

    const updateTimeSinceSync = () => {
      const now = new Date();
      const syncDate = new Date(lastSyncTime);
      const diffMs = now.getTime() - syncDate.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      
      if (diffSec < 60) {
        setTimeSinceSync(`${diffSec} sec ago`);
      } else if (diffSec < 3600) {
        setTimeSinceSync(`${Math.floor(diffSec / 60)} min ago`);
      } else if (diffSec < 86400) {
        setTimeSinceSync(`${Math.floor(diffSec / 3600)} hr ago`);
      } else {
        setTimeSinceSync(`${Math.floor(diffSec / 86400)} days ago`);
      }
    };

    updateTimeSinceSync();
    const timer = setInterval(updateTimeSinceSync, 30000); // Update every 30 seconds
    
    return () => clearInterval(timer);
  }, [lastSyncTime]);
  
  // Display sync status
  const getSyncStatusIcon = () => {
    if (!connectionVerified) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        color: "text-gray-400",
        text: "Offline"
      };
    }
    
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className="h-4 w-4" />,
          color: "text-green-500",
          text: `Synced: ${formatSyncTime()}`
        };
      case 'syncing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: "text-blue-500",
          text: "Syncing..."
        };
      case 'local-only':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          color: "text-amber-500",
          text: "Local only"
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-red-500",
          text: "Sync error"
        };
      default:
        return {
          icon: <CloudOff className="h-4 w-4" />,
          color: "text-gray-500",
          text: "Not synced"
        };
    }
  };
  
  const status = getSyncStatusIcon();

  const handleManualSync = async () => {
    await forceSyncToCloud(true);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center ${status.color} cursor-pointer group`}
            onClick={() => setShowExtended(!showExtended)}
          >
            {status.icon}
            {showExtended && (
              <div className="ml-1 flex items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Clock className="h-3 w-3 mr-1" />
                <span>{timeSinceSync}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-auto max-w-[200px]">
          <div className="space-y-2">
            <p className="text-xs">{status.text}</p>
            {lastSyncTime && (
              <p className="text-xs text-gray-500">Last sync: {formatSyncTime()}</p>
            )}
            <p className="text-xs text-gray-500">Time since: {timeSinceSync}</p>
            {connectionVerified && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs h-6 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSync();
                }}
              >
                Force Sync Now
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
