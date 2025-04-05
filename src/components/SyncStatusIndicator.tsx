
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Cloud, CloudOff, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SyncStatusIndicator: React.FC = () => {
  const [showExtended, setShowExtended] = useState(false);
  const [timeSinceSync, setTimeSinceSync] = useState<string>("never");
  
  // Format time for display
  useEffect(() => {
    const updateTimeSinceSync = () => {
      // Just showing "local only" since we removed sync functionality
      setTimeSinceSync("local only");
    };

    updateTimeSinceSync();
    const timer = setInterval(updateTimeSinceSync, 30000); // Update every 30 seconds
    
    return () => clearInterval(timer);
  }, []);
  
  // Simplified status since we no longer have sync functionality
  const status = {
    icon: <CloudOff className="h-4 w-4" />,
    color: "text-gray-400",
    text: "Local Only"
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
            <p className="text-xs text-gray-500">
              Your data is stored locally on your device.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
