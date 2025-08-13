import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTransactions } from '@/context/transaction';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, Wifi, WifiOff, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const isOnline = useNetworkStatus();
  const { pendingSyncCount } = useTransactions();

  if (showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {pendingSyncCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingSyncCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{pendingSyncCount} items waiting to sync</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Cloud className="h-4 w-4 text-blue-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-xs text-muted-foreground">
            {isOnline ? 'Synced' : 'Local'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-500" />
            )}
            {pendingSyncCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {pendingSyncCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isOnline ? 'Online' : 'Offline Mode'}
            </p>
            <p className="text-xs">
              {isOnline 
                ? 'Your data syncs automatically'
                : 'You can still add transactions - they\'ll sync when online'
              }
            </p>
            {pendingSyncCount > 0 && (
              <p className="text-xs text-amber-600">
                {pendingSyncCount} items waiting to sync
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};