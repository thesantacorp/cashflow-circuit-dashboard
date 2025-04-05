
import React from "react";
import { Check, Mail } from "lucide-react";
import SyncStatusIndicator from "./SyncStatusIndicator";

interface UuidInfoProps {
  userUuid: string;
  userEmail: string | null;
  syncStatus: 'synced' | 'local-only' | 'unknown';
}

const UuidInfo: React.FC<UuidInfoProps> = ({ userUuid, userEmail, syncStatus }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-green-600">
        <Check className="h-5 w-5" />
        <span className="font-medium">User ID is active</span>
      </div>
      
      <div className="text-sm text-muted-foreground break-all">
        <span className="font-medium">Your ID:</span> {userUuid}
      </div>
      
      {userEmail && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Mail className="h-4 w-4" />
          <span>Linked to: {userEmail}</span>
        </div>
      )}
      
      <SyncStatusIndicator syncStatus={syncStatus} />
      
      {syncStatus === 'local-only' && (
        <p className="text-xs text-amber-600 mt-1">
          Note: Your User ID might be in read-only mode due to database permissions.
          Data is securely stored locally.
        </p>
      )}
      
      <p className="text-sm text-muted-foreground mt-2">
        Your transactions are securely linked to this ID. Keep it safe for data recovery.
      </p>
    </div>
  );
};

export default UuidInfo;
