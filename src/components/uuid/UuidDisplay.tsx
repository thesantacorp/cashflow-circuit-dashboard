
import React from "react";
import { Check, Mail, Wifi, WifiOff } from "lucide-react";

interface UuidDisplayProps {
  userUuid: string;
  userEmail: string | null;
  connectionVerified: boolean;
}

const UuidDisplay: React.FC<UuidDisplayProps> = ({ userUuid, userEmail, connectionVerified }) => {
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
      
      <div className={`flex items-center gap-2 text-sm mt-1 ${
        connectionVerified ? 'text-green-600' : 'text-amber-600'
      }`}>
        {connectionVerified ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Cloud connection active</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>No cloud connection</span>
          </>
        )}
      </div>
    </div>
  );
};

export default UuidDisplay;
