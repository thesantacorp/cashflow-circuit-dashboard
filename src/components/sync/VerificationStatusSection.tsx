
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Database } from "lucide-react";
import SyncVerificationStatus from "../SyncVerificationStatus";

interface VerificationStatusSectionProps {
  userUuid: string | null;
  userEmail: string | null;
  verificationStatus: 'checking' | 'synced' | 'not-synced' | 'rls-issue' | null;
  checkSyncStatus: () => void;
  isLoading: boolean;
}

const VerificationStatusSection: React.FC<VerificationStatusSectionProps> = ({
  userUuid,
  userEmail,
  verificationStatus,
  checkSyncStatus,
  isLoading
}) => {
  const [showServerStatus, setShowServerStatus] = useState(false);
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-indigo-700">Your User ID Cloud Sync Status:</h3>
      
      {userUuid && userEmail ? (
        <div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={checkSyncStatus} 
                className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {verificationStatus === null ? "Check Sync Status" : "Refresh Sync Status"}
              </Button>
              
              <Button
                onClick={() => setShowServerStatus(!showServerStatus)}
                variant="outline"
                className="mt-2"
              >
                <Database className="mr-2 h-4 w-4" />
                {showServerStatus ? "Hide Server Status" : "Check Server Status"}
              </Button>
            </div>
            
            {showServerStatus && (
              <div className="mt-3">
                <SyncVerificationStatus className="mt-2" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-amber-600 text-sm">
          You need to generate a User ID first before checking sync status.
        </div>
      )}
    </div>
  );
};

export default VerificationStatusSection;
