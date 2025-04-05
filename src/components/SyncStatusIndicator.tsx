import React from "react";
import { useTransactions } from "@/context/transaction";
import { Cloud, CloudOff, Loader2, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime, connectionVerified } = useTransactions();
  
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
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${status.color} cursor-default`}>
            {status.icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{status.text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
