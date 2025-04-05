import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Server, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { verifySupabaseSetup, attemptSupabaseSetupFix } from "@/utils/verification";
import RlsConfigGuide from "./RlsConfigGuide";
import StatusGrid from "./status/StatusGrid";
import VerificationActions from "./status/VerificationActions";

interface VerificationStatusProps {
  className?: string;
  onComplete?: (success: boolean) => void;
  autoVerify?: boolean;
}

const SyncVerificationStatus: React.FC<VerificationStatusProps> = ({ 
  className,
  onComplete,
  autoVerify = false
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    connected: boolean;
    tableExists: boolean;
    hasReadAccess: boolean;
    hasWriteAccess: boolean;
    details: string;
    hasRlsError?: boolean;
  } | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  useEffect(() => {
    if (autoVerify) {
      runVerification();
    }
  }, [autoVerify]);
  
  const runVerification = async () => {
    setIsVerifying(true);
    
    try {
      toast.loading('Verifying Supabase connection...', { id: 'verification' });
      const result = await verifySupabaseSetup();
      
      const hasRlsError = result.details.includes('policy');
      setVerification({
        ...result,
        hasRlsError
      });
      
      if (result.connected && result.tableExists && result.hasReadAccess && result.hasWriteAccess) {
        toast.success('All Supabase settings are properly configured!', { id: 'verification' });
        if (onComplete) onComplete(true);
      } else if (result.connected && result.tableExists && !result.hasWriteAccess && hasRlsError) {
        toast.error('Database permission error (42501)', { 
          id: 'verification',
          description: 'Row-Level Security policies are restricting write access',
          duration: 10000
        });
        if (onComplete) onComplete(false);
      } else if (!result.connected) {
        toast.error('Cannot connect to Supabase', {
          id: 'verification',
          description: 'Check your internet connection and try again'
        });
        if (onComplete) onComplete(false);
      } else {
        toast.error('Some Supabase settings need attention', { id: 'verification' });
        if (onComplete) onComplete(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error running verification', { id: 'verification' });
      if (onComplete) onComplete(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const attemptFix = async () => {
    setIsFixing(true);
    
    try {
      toast.loading('Attempting to fix database issues...', { id: 'fix-attempt' });
      const success = await attemptSupabaseSetupFix();
      
      if (success) {
        toast.success('Successfully applied fixes!', { id: 'fix-attempt' });
        await runVerification();
      } else {
        toast.error('Automatic fix was not successful', { 
          id: 'fix-attempt',
          description: 'Please follow the manual steps in the guide below'
        });
      }
    } catch (error) {
      console.error('Fix attempt error:', error);
      toast.error('Error attempting to fix Supabase setup', { id: 'fix-attempt' });
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className={`border-indigo-200 shadow-md ${className || ''}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold text-indigo-700 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Database Connection Status
            </h3>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={runVerification}
              disabled={isVerifying || isFixing}
              className="relative"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Verify Connection
                </>
              )}
            </Button>
          </div>
          
          {verification && (
            <div className="space-y-3 mt-3 border border-indigo-100 rounded-md p-3 bg-indigo-50/50">
              <StatusGrid verification={verification} />
              <VerificationActions 
                verification={verification} 
                isFixing={isFixing} 
                isVerifying={isVerifying}
                attemptFix={attemptFix}
                runVerification={runVerification}
              />
            </div>
          )}
        </CardContent>
        
        {verification && (
          <CardFooter className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
            Last verification: {new Date().toLocaleTimeString()}
          </CardFooter>
        )}
      </Card>
      
      {verification?.hasRlsError && !verification.hasWriteAccess && (
        <div id="rls-config-guide">
          <RlsConfigGuide />
        </div>
      )}
    </div>
  );
};

export default SyncVerificationStatus;
