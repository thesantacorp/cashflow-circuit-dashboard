
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Star } from "lucide-react";
import { toast } from "sonner";
import SyncVerification from "./SyncVerification";
import RlsConfigGuide from "./RlsConfigGuide";
import DataRestoration from "./DataRestoration";
import UuidDisplay from "./uuid/UuidDisplay";
import SyncStatusBadge from "./uuid/SyncStatusBadge";
import UuidSetup from "./uuid/UuidSetup";
import UuidControls from "./uuid/UuidControls";

const UuidStatus: React.FC = () => {
  const { 
    userUuid, 
    userEmail, 
    generateUserUuid, 
    syncStatus, 
    forceSyncToCloud, 
    checkSyncStatus,
    connectionVerified 
  } = useTransactions();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [hasRlsIssue, setHasRlsIssue] = useState<boolean>(false);
  const [showDataRestoration, setShowDataRestoration] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus().then(() => {
        setLastCheckTime(new Date());
        // Set last sync time if sync was successful
        if (syncStatus === 'synced') {
          setLastSyncTime(new Date());
        }
      });
    }
  }, [userUuid, userEmail, syncStatus, checkSyncStatus]);

  const handleGenerateUuid = async (email: string) => {
    setIsGenerating(true);
    try {
      await generateUserUuid(email);
      setShowVerification(true);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Error generating UUID:", error);
      toast.error("Failed to generate User ID. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const success = await forceSyncToCloud();
      if (success) {
        toast.success("Successfully synced to cloud!");
        setShowVerification(true);
        setLastCheckTime(new Date());
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error("Error syncing to cloud:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifyStatus = () => {
    checkSyncStatus().then(() => {
      setLastCheckTime(new Date());
      
      if (syncStatus === 'synced') {
        setLastSyncTime(new Date());
      }
      
      if (syncStatus === 'error') {
        checkForRlsIssues();
      }
    });
  };

  const checkForRlsIssues = async () => {
    try {
      const { verifySupabaseSetup } = await import('@/utils/supabaseVerification');
      const result = await verifySupabaseSetup();
      
      if (result.connected && !result.hasWriteAccess && result.details.includes('RLS')) {
        setHasRlsIssue(true);
        setShowVerification(true);
      }
    } catch (error) {
      console.error('Error checking for RLS issues:', error);
    }
  };

  return (
    <>
      <Card className="border-orange-200 shadow-lg bg-gradient-to-b from-white to-orange-50/30">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            User ID Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {userUuid ? (
            <div className="flex flex-col gap-2">
              <UuidDisplay 
                userUuid={userUuid}
                userEmail={userEmail}
                connectionVerified={connectionVerified}
              />
              
              <SyncStatusBadge syncStatus={syncStatus} hasRlsIssue={hasRlsIssue} />
              
              <UuidControls 
                syncStatus={syncStatus}
                connectionVerified={connectionVerified}
                isSyncing={isSyncing}
                onSyncToCloud={handleSyncToCloud}
                onVerifyStatus={handleVerifyStatus}
                onToggleDetails={() => setShowVerification(!showVerification)}
                showVerification={showVerification}
                hasRlsIssue={hasRlsIssue}
                lastCheckTime={lastCheckTime}
                lastSyncTime={lastSyncTime}
              />
            </div>
          ) : showDataRestoration ? (
            <DataRestoration onCancel={() => setShowDataRestoration(false)} />
          ) : (
            <UuidSetup 
              onGenerateUuid={handleGenerateUuid}
              onShowRestoration={() => setShowDataRestoration(true)}
              isGenerating={isGenerating}
              connectionVerified={connectionVerified}
            />
          )}
        </CardContent>
      </Card>
      
      {userUuid && showVerification && (
        <div className="mt-4">
          <SyncVerification />
        </div>
      )}
      
      <div id="rls-config-guide" style={{ display: 'none' }}>
        <RlsConfigGuide />
      </div>
    </>
  );
};

export default UuidStatus;
