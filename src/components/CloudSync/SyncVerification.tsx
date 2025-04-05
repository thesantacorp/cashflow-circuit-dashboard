
import React, { useState, useEffect } from "react";
import { verifyUuidInSupabase, getAllUuids } from "@/utils/supabase/index";
import { verifySupabaseSetup } from "@/utils/supabaseVerification";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import SyncVerificationStatus from "./SyncVerificationStatus";
import SyncStatusBadge from "./SyncStatusBadge";
import UuidTable from "./UuidTable";

const SyncVerification: React.FC = () => {
  const { userUuid, userEmail, forceSyncToCloud } = useTransactions();
  const [syncStatus, setSyncStatus] = useState<'checking' | 'synced' | 'not-synced' | null>(null);
  const [allUuids, setAllUuids] = useState<any[] | null>(null);
  const [showAllUuids, setShowAllUuids] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showServerStatus, setShowServerStatus] = useState(false);
  
  // Auto-check verification on component mount
  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus();
    }
  }, [userUuid, userEmail]);
  
  const checkSyncStatus = async () => {
    if (!userUuid || !userEmail) {
      toast.error("No User ID or email found to verify");
      return;
    }
    
    setSyncStatus('checking');
    setIsLoading(true);
    
    try {
      const isInSupabase = await verifyUuidInSupabase(userEmail, userUuid);
      setSyncStatus(isInSupabase ? 'synced' : 'not-synced');
      
      if (isInSupabase) {
        toast.success("Verified! Your User ID is successfully synced to the cloud.");
      } else {
        toast.error("Your User ID is not yet synced to the cloud.");
        
        // Run a verification to check if the issue is with permissions
        const verification = await verifySupabaseSetup();
        
        // If the issue is with write permissions, inform the user
        if (verification.connected && !verification.hasWriteAccess) {
          toast.warning("Database permission issue detected", {
            description: "Using local storage mode due to write restrictions"
          });
        } else {
          // Only auto-attempt sync if it's not a permissions issue
          const syncAttempt = await forceSyncToCloud();
          if (syncAttempt) {
            // Re-verify after sync attempt
            const recheck = await verifyUuidInSupabase(userEmail, userUuid);
            if (recheck) {
              setSyncStatus('synced');
              toast.success("Successfully synced your User ID to the cloud!");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error verifying sync status:", error);
      setSyncStatus('not-synced');
      toast.error("Failed to verify sync status");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadAllUuids = async () => {
    setIsLoading(true);
    
    try {
      const uuids = await getAllUuids();
      setAllUuids(uuids);
      
      if (!uuids || uuids.length === 0) {
        toast.info("No User IDs found in the database");
      }
    } catch (error) {
      console.error("Error loading all UUIDs:", error);
      toast.error("Failed to load User IDs from the database");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
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
        {/* Check sync status section */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-indigo-700">Your User ID Cloud Sync Status:</h3>
          
          {userUuid && userEmail ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  Email: {userEmail}
                </Badge>
                <Badge variant="outline" className="px-2 py-1 text-xs overflow-hidden text-ellipsis">
                  ID: {userUuid.substring(0, 8)}...
                </Badge>
              </div>
              
              <SyncStatusBadge syncStatus={syncStatus} />
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={checkSyncStatus} 
                  className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {syncStatus === null ? "Check Sync Status" : "Refresh Sync Status"}
                </Button>
                
                <Button
                  onClick={() => setShowServerStatus(!showServerStatus)}
                  variant="outline"
                  className="mt-2"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {showServerStatus ? "Hide Server Status" : "Check Server Status"}
                </Button>
              </div>
              
              {showServerStatus && (
                <div className="mt-3">
                  <SyncVerificationStatus className="mt-2" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-amber-600 text-sm">
              You need to generate a User ID first before checking sync status.
            </div>
          )}
        </div>
        
        {/* Admin section to view all UUIDs */}
        <div className="space-y-2 pt-2 border-t border-indigo-100">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm text-indigo-700">Database Records (Admin):</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllUuids(!showAllUuids)}
              className="text-indigo-600 hover:text-indigo-700 p-1 h-auto"
            >
              {showAllUuids ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {showAllUuids && (
            <>
              <Button
                onClick={loadAllUuids}
                variant="outline"
                size="sm"
                className="text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Loading...</>
                ) : (
                  "Load Database Records"
                )}
              </Button>
              
              {allUuids && <UuidTable records={allUuids} userEmail={userEmail} />}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncVerification;
