import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Check, Star, Clock, Rocket, Zap, Mail, Loader2, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SyncVerification from "./SyncVerification";

const UuidStatus: React.FC = () => {
  const { userUuid, userEmail, generateUserUuid, syncStatus, forceSyncToCloud, checkSyncStatus } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(true); // Show verification by default

  // Check sync status on mount
  useEffect(() => {
    if (userUuid && userEmail) {
      checkSyncStatus();
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
              
              {/* Sync status indicator */}
              <div className={`flex items-center gap-2 text-sm mt-1 ${
                syncStatus === 'synced' 
                  ? 'text-green-600' 
                  : syncStatus === 'local-only' 
                    ? 'text-amber-600' 
                    : 'text-gray-500'
              }`}>
                {syncStatus === 'synced' ? (
                  <>
                    <Cloud className="h-4 w-4" />
                    <span>Synced to cloud</span>
                  </>
                ) : syncStatus === 'local-only' ? (
                  <>
                    <CloudOff className="h-4 w-4" />
                    <span>Stored locally only</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Sync status unknown</span>
                  </>
                )}
              </div>
              
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
              
              {syncStatus === 'local-only' && (
                <p className="text-xs text-amber-600 mt-1">
                  Note: Your User ID might be in read-only mode due to database permissions.
                  Data is securely stored locally.
                </p>
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
      
      {/* Verification component - now shown by default when user has a UUID */}
      {userUuid && showVerification && <div className="mt-4"><SyncVerification /></div>}
    </>
  );
};

export default UuidStatus;
