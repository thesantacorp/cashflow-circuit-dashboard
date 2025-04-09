
import React from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NetworkStatusIndicatorProps {
  className?: string;
  minimal?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ className, minimal = false }) => {
  const isOnline = useNetworkStatus();

  if (minimal) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center", className)}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 
              "Online - Data will sync automatically" : 
              "Offline - You can still record expenses! Data will sync when you reconnect."}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-md", 
      isOnline ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700",
      className)}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Offline - You can still record expenses!</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
