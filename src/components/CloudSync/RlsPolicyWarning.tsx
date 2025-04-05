
import React from "react";
import { ShieldAlert } from "lucide-react";

const RlsPolicyWarning: React.FC = () => {
  return (
    <div className="p-2 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <div className="flex gap-2 items-start">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-800">
          <p className="font-medium">RLS Policy Issue Detected</p>
          <p className="mt-1">Your Supabase project has Row Level Security policies that prevent writing to the database. 
          The app will work in local-only mode until this is fixed.</p>
        </div>
      </div>
    </div>
  );
};

export default RlsPolicyWarning;
