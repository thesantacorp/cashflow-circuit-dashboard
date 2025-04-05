
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Server, Database } from "lucide-react";
import { toast } from "sonner";
import { verifySupabaseSetup, attemptSupabaseSetupFix } from "@/utils/supabaseVerification";
import RlsConfigGuide from "./RlsConfigGuide";

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
    hasRlsError?: boolean;
  } | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  const runVerification = async () => {
    setIsVerifying(true);
    
    try {
      toast.loading('Verifying Supabase connection...', { id: 'verification' });
      const result = await verifySupabaseSetup();
      
      // Check specifically for RLS policy issues
      const hasRlsError = result.details.includes('policy');
      setVerification({
        ...result,
        hasRlsError
      });
      
      if (result.connected && result.tableExists && result.hasReadAccess && result.hasWriteAccess) {
        toast.success('All Supabase settings are properly configured!', { id: 'verification' });
        if (onComplete) onComplete(true);
      } else if (result.connected && result.tableExists && !result.hasWriteAccess && hasRlsError) {
        toast.error('Supabase RLS policy configuration needed', { 
          id: 'verification',
          description: 'Database permissions need to be updated'
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
    <div className="space-y-4">
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
            </div>
          )}
        </CardContent>
        
        {verification && (
          <CardFooter className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
            Last verification: {new Date().toLocaleTimeString()}
          </CardFooter>
        )}
      </Card>
      
      {/* Show RLS Policy Guide if we detect an RLS policy error */}
      {verification?.hasRlsError && !verification.hasWriteAccess && (
        <RlsConfigGuide />
      )}
    </div>
  );
};

interface StatusItemProps {
  label: string;
  status: boolean;
  description: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, status, description }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}:</span>
      <Badge 
        variant={status ? "default" : "destructive"}
        className={`${status ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
      >
        {status ? "OK" : "Issue"}
      </Badge>
    </div>
    <p className="text-xs text-gray-600 flex items-center gap-1">
      {status ? (
        <CheckCircle2 className="h-3 w-3 text-green-600" />
      ) : (
        <XCircle className="h-3 w-3 text-red-600" />
      )}
      {description}
    </p>
  </div>
);

export default SyncVerificationStatus;
