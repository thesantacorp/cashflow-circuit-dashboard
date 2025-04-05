
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Server, Database } from "lucide-react";
import { toast } from "sonner";
import { verifySupabaseSetup, attemptSupabaseSetupFix } from "@/utils/supabaseVerification";
import StatusItem from "./StatusItem";
import RlsPolicyWarning from "./RlsPolicyWarning";

interface VerificationStatusProps {
  className?: string;
  onComplete?: (success: boolean) => void;
}

const SyncVerificationStatus: React.FC<VerificationStatusProps> = ({ 
  className,
  onComplete 
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    connected: boolean;
    tableExists: boolean;
    hasReadAccess: boolean;
    hasWriteAccess: boolean;
    details: string;
  } | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  const runVerification = async () => {
    setIsVerifying(true);
    
    try {
      toast.loading('Verifying Supabase connection...', { id: 'verification' });
      const result = await verifySupabaseSetup();
      setVerification(result);
      
      if (result.connected && result.tableExists && result.hasReadAccess && result.hasWriteAccess) {
        toast.success('All Supabase settings are properly configured!', { id: 'verification' });
        if (onComplete) onComplete(true);
      } else if (result.connected && !result.hasWriteAccess) {
        toast.warning('Database connection has read-only access', {
          id: 'verification',
          description: 'Row-level security policy needs adjustment'
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
      const success = await attemptSupabaseSetupFix();
      
      if (success) {
        // Re-run verification to update the UI
        await runVerification();
      }
    } catch (error) {
      console.error('Fix attempt error:', error);
      toast.error('Error attempting to fix Supabase setup');
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <Card className={`border-indigo-200 shadow-md ${className || ''}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-indigo-700 flex items-center gap-2">
            <Server className="h-4 w-4" />
            Supabase Connection Status
          </h3>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={runVerification}
            disabled={isVerifying || isFixing}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Connection'
            )}
          </Button>
        </div>
        
        {verification && (
          <div className="space-y-3 mt-3 border border-indigo-100 rounded-md p-3 bg-indigo-50/50">
            <div className="grid grid-cols-2 gap-2">
              <StatusItem 
                label="Connection"
                status={verification.connected}
                description={verification.connected ? "Successfully connected to Supabase" : "Cannot connect to Supabase"}
              />
              
              <StatusItem 
                label="Table Exists"
                status={verification.tableExists}
                description={verification.tableExists ? "user_uuids table exists" : "user_uuids table not found"}
              />
              
              <StatusItem 
                label="Read Access"
                status={verification.hasReadAccess}
                description={verification.hasReadAccess ? "Can read from database" : "Cannot read from database"}
              />
              
              <StatusItem 
                label="Write Access"
                status={verification.hasWriteAccess}
                description={verification.hasWriteAccess ? "Can write to database" : "Cannot write to database"}
              />
            </div>
            
            {!verification.tableExists && (
              <div className="mt-2">
                <Button 
                  size="sm"
                  variant="outline" 
                  className="w-full bg-indigo-100 hover:bg-indigo-200 border-indigo-300"
                  onClick={attemptFix}
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Attempting fix...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-3 w-3" />
                      Create Missing Table
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {verification.connected && !verification.hasWriteAccess && <RlsPolicyWarning />}
          </div>
        )}
      </CardContent>
      
      {verification && (
        <CardFooter className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
          Last verification: {new Date().toLocaleTimeString()}
        </CardFooter>
      )}
    </Card>
  );
};

export default SyncVerificationStatus;
