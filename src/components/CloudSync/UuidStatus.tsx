
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Cloud, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import UuidInfo from "./UuidInfo";
import UuidForm from "./UuidForm";
import SyncVerification from "./SyncVerification";

const UuidStatus: React.FC = () => {
  const { userUuid, userEmail, generateUserUuid, syncStatus, forceSyncToCloud, checkSyncStatus } = useTransactions();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(true);

  // Check sync status on mount
  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus();
    }
  }, [userUuid, userEmail, checkSyncStatus]);

  const handleGenerateUuid = async (email: string) => {
    try {
      await generateUserUuid(email);
      // Automatically show verification after generation
      setShowVerification(true);
    } catch (error) {
      console.error("Error generating UUID:", error);
      toast.error("Failed to generate User ID. Please try again.");
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const success = await forceSyncToCloud();
      if (success) {
        toast.success("Successfully synced to cloud!");
        // Automatically show verification after sync
        setShowVerification(true);
      }
    } catch (error) {
      console.error("Error syncing to cloud:", error);
    } finally {
      setIsSyncing(false);
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
            <>
              <UuidInfo 
                userUuid={userUuid}
                userEmail={userEmail}
                syncStatus={syncStatus}
              />
              
              {syncStatus === 'local-only' && (
                <Button
                  onClick={handleSyncToCloud}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-4 w-4" />
                      Sync to Cloud
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={() => setShowVerification(!showVerification)}
                variant={showVerification ? "default" : "ghost"}
                size="sm"
                className={`mt-3 ${showVerification ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"}`}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {showVerification ? "Hide Verification" : "Verify Cloud Sync"}
              </Button>
            </>
          ) : (
            <UuidForm onGenerateUuid={handleGenerateUuid} />
          )}
        </CardContent>
      </Card>
      
      {/* Verification component - now shown by default when user has a UUID */}
      {userUuid && showVerification && <div className="mt-4"><SyncVerification /></div>}
    </>
  );
};

export default UuidStatus;
