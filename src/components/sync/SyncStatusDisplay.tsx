
import React from "react";
import { CheckCircle, XCircle, Shield } from "lucide-react";

interface SyncStatusDisplayProps {
  verificationStatus: 'checking' | 'synced' | 'not-synced' | 'rls-issue' | null;
}

const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ verificationStatus }) => {
  if (verificationStatus === 'checking') {
    return null;
  }
  
  if (verificationStatus === 'synced') {
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
  
  if (verificationStatus === 'rls-issue') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-3">
        <Shield className="h-6 w-6 text-amber-600" />
        <div>
          <h4 className="font-semibold text-amber-800">Database permissions issue</h4>
          <p className="text-sm text-amber-700">RLS policies are preventing database writes</p>
        </div>
      </div>
    );
  }
  
  if (verificationStatus === 'not-synced') {
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

export default SyncStatusDisplay;
