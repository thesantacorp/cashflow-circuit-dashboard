
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  KeyRound, Check, Star, Clock, Rocket, Zap, Mail, Loader2, 
  Cloud, CloudOff, RefreshCw, AlertTriangle, Wifi, WifiOff 
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SyncVerification from "./SyncVerification";

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

  // Check sync status on mount
  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus().then(() => {
        setLastCheckTime(new Date());
      });
    }
  }, [userUuid, userEmail, checkSyncStatus]);

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
      // Automatically show verification after generation
      setShowVerification(true);
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
        // Automatically show verification after sync
        setShowVerification(true);
        setLastCheckTime(new Date());
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
    });
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
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Sync error',
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

  const statusDisplay = getSyncStatusDisplay();

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
              
              {/* Connection status indicator */}
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
              
              {/* Sync status indicator */}
              <div className={`flex items-center gap-2 text-sm mt-1 ${statusDisplay.color}`}>
                {statusDisplay.icon}
                <span>{statusDisplay.text}</span>
              </div>
              
              {lastCheckTime && (
                <div className="text-xs text-gray-500 mt-1">
                  Last checked: {lastCheckTime.toLocaleTimeString()}
                </div>
              )}
              
              {/* Action buttons based on sync status */}
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
                        <Cloud className="mr-2 h-4 w-4" />
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
                  className={`flex-1 ${showVerification ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                >
                  {showVerification ? "Hide Details" : "Show Details"}
                </Button>
              </div>
              
              {/* Offline warning */}
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
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                <Star className="h-5 w-5" /> Never lose your data! 🌟
              </h3>
              
              <div className="flex items-center gap-2 text-orange-600 mt-1">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Create Your Unique ID in Seconds! ⏱️</span>
              </div>
              
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Rocket className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your ID makes data recovery a breeze. Let's get you set up in no time! 🚀</span>
              </p>
              
              {showEmailInput ? (
                <div className="space-y-2 mt-2">
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
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Simply bind your email and you're all set up 🎉</span>
                </p>
              )}
              
              {/* Connection status for new users */}
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
                ) : showEmailInput ? (
                  "Confirm and Generate ID"
                ) : (
                  "Generate User ID"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Verification component - conditionally shown */}
      {userUuid && showVerification && <div className="mt-4"><SyncVerification /></div>}
    </>
  );
};

export default UuidStatus;
