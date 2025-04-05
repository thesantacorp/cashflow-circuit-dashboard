
import React, { useState } from "react";
import { verifyUuidInSupabase, getAllUuids } from "@/utils/supabase";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, RefreshCw, Database, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const SyncVerification: React.FC = () => {
  const { userUuid, userEmail } = useTransactions();
  const [syncStatus, setSyncStatus] = useState<'checking' | 'synced' | 'not-synced' | null>(null);
  const [allUuids, setAllUuids] = useState<any[] | null>(null);
  const [showAllUuids, setShowAllUuids] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
        toast.success("Verified! Your User ID is successfully stored in the cloud.");
      } else {
        toast.error("Your User ID is not yet synced to the cloud.");
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
          <Database className="h-5 w-5" />
          Sync Verification
        </CardTitle>
        <CardDescription>
          Verify if your User ID is properly synced to the cloud
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Check sync status section */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-indigo-700">Check Your User ID Sync Status:</h3>
          
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
              
              <div className="flex flex-col gap-2">
                {syncStatus === 'checking' ? (
                  <div className="flex items-center gap-2 text-amber-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Checking sync status...</span>
                  </div>
                ) : syncStatus === 'synced' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Successfully synced to cloud!</span>
                  </div>
                ) : syncStatus === 'not-synced' ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Not synced to cloud</span>
                  </div>
                ) : null}
                
                <Button 
                  onClick={checkSyncStatus} 
                  className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Verify Sync Status
                </Button>
              </div>
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
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Database Records"
                )}
              </Button>
              
              {allUuids && (
                <div className="mt-2">
                  {allUuids.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <div className="text-xs font-medium bg-indigo-50 text-indigo-800 p-2 grid grid-cols-3">
                        <div>Email</div>
                        <div>UUID</div>
                        <div>Created</div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {allUuids.map((item, index) => (
                          <div 
                            key={index}
                            className={`text-xs p-2 grid grid-cols-3 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } ${item.email === userEmail ? 'bg-indigo-50' : ''}`}
                          >
                            <div className="truncate">{item.email}</div>
                            <div className="truncate">{item.uuid.substring(0, 8)}...</div>
                            <div>{new Date(item.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No records found in database</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncVerification;
