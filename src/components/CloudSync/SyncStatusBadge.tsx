
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface SyncStatusBadgeProps {
  syncStatus: 'checking' | 'synced' | 'not-synced' | null;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ syncStatus }) => {
  if (syncStatus === 'checking') {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Checking sync status...</span>
      </div>
    );
  } 
  
  if (syncStatus === 'synced') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h4 className="font-semibold text-green-800">Successfully synced to cloud!</h4>
          <p className="text-sm text-green-700">Your User ID is securely stored in the cloud database</p>
        </div>
      </div>
    );
  } 
  
  if (syncStatus === 'not-synced') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-3">
        <XCircle className="h-6 w-6 text-red-600" />
        <div>
          <h4 className="font-semibold text-red-800">Not synced to cloud</h4>
          <p className="text-sm text-red-700">Your User ID is only stored locally</p>
        </div>
      </div>
    );
  }
  
  return (
    <p className="text-sm text-gray-600">Click the button below to check if your User ID is synced to the cloud.</p>
  );
};

export default SyncStatusBadge;
