
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import SyncStatusDisplay from "./SyncStatusDisplay";
import { verifyUuidInSupabase } from "@/utils/supabase/index";
import { toast } from "sonner";

interface SyncStatusCheckerProps {
  userUuid: string | null;
  userEmail: string | null;
  forceSyncToCloud: () => Promise<boolean>;
}

const SyncStatusChecker: React.FC<SyncStatusCheckerProps> = ({
  userUuid,
  userEmail,
  forceSyncToCloud
}) => {
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'synced' | 'not-synced' | 'rls-issue' | null>(null);
  
  // Verify sync status with Supabase
  const checkSyncStatus = async () => {
    if (!userUuid || !userEmail) {
      toast.error("No User ID or email found to verify");
      return;
    }
    
    setVerificationStatus('checking');
    
    try {
      const isInSupabase = await verifyUuidInSupabase(userEmail, userUuid);
      
      if (isInSupabase) {
        setVerificationStatus('synced');
        toast.success("Verified! Your User ID is successfully synced to the cloud.");
      } else {
        // Try to determine if this is an RLS policy issue
        const { verifySupabaseSetup } = await import('@/utils/supabaseVerification');
        const setupResult = await verifySupabaseSetup();
        
        if (setupResult.connected && setupResult.tableExists && !setupResult.hasWriteAccess && 
            setupResult.details.includes('RLS policies')) {
          setVerificationStatus('rls-issue');
          toast.error("Database write permissions error", {
            description: "RLS policies preventing write access"
          });
        } else {
          setVerificationStatus('not-synced');
          toast.error("Your User ID is not yet synced to the cloud.");
          
          // Auto-attempt sync if not synced
          const syncAttempt = await forceSyncToCloud();
          if (syncAttempt) {
            // Re-verify after sync attempt
            const recheck = await verifyUuidInSupabase(userEmail, userUuid);
            if (recheck) {
              setVerificationStatus('synced');
              toast.success("Successfully synced your User ID to the cloud!");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error verifying sync status:", error);
      setVerificationStatus('not-synced');
      toast.error("Failed to verify sync status");
    }
  };
  
  return (
    <div>
      {userUuid && userEmail && (
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="px-2 py-1 text-xs">
            Email: {userEmail}
          </Badge>
          <Badge variant="outline" className="px-2 py-1 text-xs overflow-hidden text-ellipsis">
            ID: {userUuid.substring(0, 8)}...
          </Badge>
        </div>
      )}
      
      {verificationStatus === 'checking' ? (
        <div className="flex items-center gap-2 text-amber-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking sync status...</span>
        </div>
      ) : (
        <SyncStatusDisplay verificationStatus={verificationStatus} />
      )}
      
      {/* Return the checkSyncStatus function so it can be called from parent */}
      <div style={{ display: 'none' }} data-check-sync={!!checkSyncStatus}></div>
    </div>
  );
};

export default SyncStatusChecker;
