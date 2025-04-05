
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  KeyRound, Check, Star, Clock, Rocket, Zap, Mail, Loader2, 
  Cloud, CloudOff, RefreshCw, AlertTriangle, Wifi, WifiOff, Shield,
  Download, Upload
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SyncVerification from "./SyncVerification";
import RlsConfigGuide from "./RlsConfigGuide";
import DataRestoration from "./DataRestoration";

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
  const [email, setEmail] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
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

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleGenerateUuid = async () => {
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsGenerating(true);
    try {
      await generateUserUuid(email);
      setShowEmailInput(false);
      setEmail("");
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

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: 'Synced to cloud',
          color: 'text-green-600'
        };
      case 'syncing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Syncing to cloud...',
          color: 'text-indigo-600'
        };
      case 'local-only':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          text: 'Stored locally only',
          color: 'text-amber-600'
        };
      case 'error':
        return {
          icon: hasRlsIssue ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />,
          text: hasRlsIssue ? 'RLS policy error' : 'Sync error',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Sync status unknown',
          color: 'text-gray-500'
        };
    }
  };

  // Fix: Store the result of getSyncStatusDisplay() in a variable
  const statusDisplay = getSyncStatusDisplay();

  // Format time for display
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Never';
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">User ID is active</span>
              </div>
              <div className="text-sm text-muted-foreground break-all">
                <span className="font-medium">Your ID:</span> {userUuid}
              </div>
              {userEmail && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>Linked to: {userEmail}</span>
                </div>
              )}
              
              <div className={`flex items-center gap-2 text-sm mt-1 ${
                connectionVerified ? 'text-green-600' : 'text-amber-600'
              }`}>
                {connectionVerified ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span>Cloud connection active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>No cloud connection</span>
                  </>
                )}
              </div>
              
              <div className={`flex items-center gap-2 text-sm mt-1 ${statusDisplay.color}`}>
                {statusDisplay.icon}
                <span>{statusDisplay.text}</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                <div>Last checked: {formatTime(lastCheckTime)}</div>
                {lastSyncTime && (
                  <div>Last synced: {formatTime(lastSyncTime)}</div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {(syncStatus === 'local-only' || syncStatus === 'error') && (
                  <Button
                    onClick={handleSyncToCloud}
                    variant="outline"
                    size="sm"
                    disabled={isSyncing || !connectionVerified}
                    className="flex-1"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Sync to Cloud
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={handleVerifyStatus}
                  variant="outline"
                  size="sm"
                  disabled={!connectionVerified}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify Status
                </Button>
                
                <Button
                  onClick={() => setShowVerification(!showVerification)}
                  variant={showVerification ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${showVerification ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""} ${
                    hasRlsIssue ? "border-red-400 text-red-600 hover:border-red-500" : ""
                  }`}
                >
                  {showVerification ? "Hide Details" : hasRlsIssue ? "Show RLS Fix Guide" : "Show Details"}
                </Button>
              </div>
              
              {!connectionVerified && (
                <Alert variant="warning" className="mt-3 bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    You're currently offline. Your User ID is stored locally and will sync when your connection is restored.
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                Your transactions are securely linked to this ID. Keep it safe for data recovery.
              </p>
            </div>
          ) : showDataRestoration ? (
            <DataRestoration onCancel={() => setShowDataRestoration(false)} />
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                <Star className="h-5 w-5" /> Never lose your data! 🌟
              </h3>
              
              {showEmailInput ? (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" /> Your Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="border-orange-200 focus-visible:ring-orange-400"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll link this email to your ID for better data recovery options.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-orange-600 mt-1">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Choose Your Option 👇</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    You can generate a new User ID or import your existing data from another device.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <Button 
                      onClick={handleGenerateUuid} 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      <span>Generate New User ID</span>
                    </Button>
                    
                    <Button 
                      onClick={() => setShowDataRestoration(true)} 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span>Import Existing Data</span>
                    </Button>
                  </div>
                </>
              )}
              
              <div className={`flex items-center gap-2 text-sm ${
                connectionVerified ? 'text-green-600' : 'text-amber-600'
              }`}>
                {connectionVerified ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span>Cloud connection available</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>No cloud connection - ID will be stored locally only</span>
                  </>
                )}
              </div>
              
              {showEmailInput && (
                <Button 
                  onClick={handleGenerateUuid} 
                  className="mt-2 bg-orange-500 hover:bg-orange-600 text-white w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Confirm and Generate ID"
                  )}
                </Button>
              )}
            </div>
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
