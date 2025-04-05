
import React, { useState, useEffect, useRef } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import RlsConfigGuide from "./RlsConfigGuide";
import VerificationStatusSection from "./sync/VerificationStatusSection";
import AdminSection from "./sync/AdminSection";
import SyncStatusChecker from "./sync/SyncStatusChecker";

const SyncVerification: React.FC = () => {
  const { userUuid, userEmail, forceSyncToCloud } = useTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [hasRlsPolicyIssue, setHasRlsPolicyIssue] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'synced' | 'not-synced' | 'rls-issue' | null>(null);
  
  // Check for RLS policy issues when component mounts
  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus();
    }
  }, [userUuid, userEmail]);
  
  // Monitor for potential RLS issues
  useEffect(() => {
    if (verificationStatus === 'rls-issue') {
      setHasRlsPolicyIssue(true);
    }
  }, [verificationStatus]);
  
  const checkIfRlsPolicyIssue = async () => {
    try {
      const { verifySupabaseSetup } = await import('@/utils/verification');
      const result = await verifySupabaseSetup();
      
      if (result.connected && result.tableExists && !result.hasWriteAccess && 
          result.details.includes('RLS policies')) {
        setHasRlsPolicyIssue(true);
      }
    } catch (error) {
      console.error('Error checking for RLS policy issues:', error);
    }
  };
  
  const checkSyncStatus = async () => {
    setIsLoading(true);
    
    try {
      // Call the child component's checkSyncStatus method
      // In a real implementation, we would use refs or state lifting
      // This is a simplification since we're refactoring
      const childChecks = document.querySelectorAll('[data-check-sync]');
      if (childChecks.length > 0) {
        // This would be handled better with proper refs
        // For refactoring purposes, we're recreating the functionality here
        const isInSupabase = await verifyUuidInSupabase(userEmail!, userUuid!);
        
        if (isInSupabase) {
          setVerificationStatus('synced');
          toast.success("Verified! Your User ID is successfully synced to the cloud.");
        } else {
          await checkIfRlsPolicyIssue();
          if (hasRlsPolicyIssue) {
            setVerificationStatus('rls-issue');
          } else {
            setVerificationStatus('not-synced');
            toast.error("Your User ID is not yet synced to the cloud.");
          }
        }
      }
    } catch (error) {
      console.error("Error in parent checkSyncStatus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to maintain compatibility during refactoring
  const verifyUuidInSupabase = async (email: string, uuid: string) => {
    try {
      const { verifyUuidInSupabase } = await import('@/utils/supabase/index');
      return await verifyUuidInSupabase(email, uuid);
    } catch (error) {
      console.error("Error in verifyUuidInSupabase:", error);
      return false;
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="border-indigo-200 shadow-lg">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="text-indigo-600 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cloud Sync Verification
          </CardTitle>
          <CardDescription>
            Verify if your User ID is properly synced to the cloud database
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Sync Status Checker Component */}
          <SyncStatusChecker 
            userUuid={userUuid}
            userEmail={userEmail}
            forceSyncToCloud={forceSyncToCloud}
          />
          
          {/* Verification Status Section */}
          <VerificationStatusSection
            userUuid={userUuid}
            userEmail={userEmail}
            verificationStatus={verificationStatus}
            checkSyncStatus={checkSyncStatus}
            isLoading={isLoading}
          />
          
          {/* Admin Section for viewing all UUIDs */}
          <AdminSection 
            userEmail={userEmail}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </CardContent>
      </Card>
      
      {/* Show the RLS Config Guide if we've detected an RLS issue */}
      {hasRlsPolicyIssue && <RlsConfigGuide />}
    </div>
  );
};

export default SyncVerification;
