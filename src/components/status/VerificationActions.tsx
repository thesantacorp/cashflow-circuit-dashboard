
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Database, RefreshCw, AlertCircle } from "lucide-react";

interface VerificationActionsProps {
  verification: {
    tableExists: boolean;
    hasWriteAccess: boolean;
    hasRlsError?: boolean;
  };
  isFixing: boolean;
  isVerifying: boolean;
  attemptFix: () => Promise<void>;
  runVerification: () => Promise<void>;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({ 
  verification, isFixing, isVerifying, attemptFix, runVerification 
}) => {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {!verification.tableExists && (
        <Button 
          size="sm"
          variant="outline" 
          className="flex-1 bg-indigo-100 hover:bg-indigo-200 border-indigo-300"
          onClick={attemptFix}
          disabled={isFixing}
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Creating table...
            </>
          ) : (
            <>
              <Database className="mr-2 h-3 w-3" />
              Create Missing Table
            </>
          )}
        </Button>
      )}

      {/* Refresh button */}
      <Button 
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={runVerification}
        disabled={isVerifying}
      >
        <RefreshCw className="mr-2 h-3 w-3" />
        Refresh Status
      </Button>

      {/* View RLS Guide button only if there's an RLS issue */}
      {verification.hasRlsError && !verification.hasWriteAccess && (
        <Button 
          size="sm"
          variant="default"
          className="flex-1 bg-red-600 hover:bg-red-700"
          onClick={() => {
            const rlsGuide = document.getElementById('rls-config-guide');
            if (rlsGuide) {
              rlsGuide.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <AlertCircle className="mr-2 h-3 w-3" />
          View RLS Fix Guide
        </Button>
      )}
    </div>
  );
};

export default VerificationActions;
