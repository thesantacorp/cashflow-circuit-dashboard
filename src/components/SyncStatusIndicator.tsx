
import React from "react";
import { CloudOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SyncStatusIndicator: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-gray-400 cursor-pointer">
            <CloudOff className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-auto max-w-[200px]">
          <div className="space-y-2">
            <p className="text-xs">Local Only</p>
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
