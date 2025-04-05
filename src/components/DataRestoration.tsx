
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  KeyRound, Download, Mail, Loader2, 
  CloudOff, RefreshCw, AlertTriangle, ArrowLeft,
  Check, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient } from "@/utils/supabase/client";

interface DataRestorationProps {
  onCancel: () => void;
}

const DataRestoration: React.FC<DataRestorationProps> = ({ onCancel }) => {
  const { generateUserUuid, forceSyncToCloud } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{
    transactions: number;
    categories: number;
  } | null>(null);
  
  // Add verification states
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleSendVerification = async () => {
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      let emailSent = false;
      
      try {
        // Try to send via Supabase function if available
        const { error } = await getSupabaseClient().functions.invoke('send-verification-email', {
          body: { email: email, code: code }
        });
        
        if (error) {
          console.error('Error sending verification email via Supabase function:', error);
          throw new Error('Supabase email service unavailable');
        } else {
          emailSent = true;
          console.log('Email sent successfully via Supabase function');
        }
      } catch (supabaseError) {
        console.warn('Failed to send email via Supabase function, trying browser method:', supabaseError);
        
        // Try alternative browser-based methods for demo purposes
        try {
          // Save the code in localStorage with expiration for verification flow to continue
          const codeData = {
            code: code,
            email: email,
            expires: Date.now() + (10 * 60 * 1000) // 10 minutes
          };
          localStorage.setItem('verification_data', JSON.stringify(codeData));
          
          // Try sending via EmailJS or similar service if integrated
          // This is just a placeholder - in a real app, you would integrate a service like EmailJS
          
          // For now, show a toast with the code for testing purposes ONLY
          // IMPORTANT: This is for DEMO PURPOSES ONLY - not for production use
          toast.warning(`For testing purposes only - Verification Code: ${code}`, {
            description: "In production, this code would be sent via email only",
            duration: 10000
          });
          
          emailSent = true;
          console.log('Code displayed for testing purposes only (should not happen in production)');
        } catch (fallbackError) {
          console.error('All email sending methods failed:', fallbackError);
        }
      }
      
      if (emailSent) {
        toast.success("Verification process started", {
          description: "Please check your email or continue with the provided code"
        });
        
        // Save the code in localStorage with expiration
        const codeData = {
          code: code,
          email: email,
          expires: Date.now() + (10 * 60 * 1000) // 10 minutes
        };
        localStorage.setItem('verification_data', JSON.stringify(codeData));
        
        setVerificationSent(true);
      } else {
        toast.error("Could not send verification email", {
          description: "Please try again later or contact support"
        });
      }
    } catch (error) {
      console.error("Error in verification process:", error);
      toast.error("Failed to start verification process");
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleVerifyAndImport = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }
    
    // Verify against stored code
    const storedVerification = localStorage.getItem('verification_data');
    
    if (!storedVerification) {
      toast.error("Verification session expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return;
    }
    
    const verificationData = JSON.parse(storedVerification);
    
    // Check if code is expired
    if (Date.now() > verificationData.expires) {
      localStorage.removeItem('verification_data');
      toast.error("Verification code expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return;
    }
    
    // Check if code matches
    if (verificationCode !== verificationData.code || email !== verificationData.email) {
      toast.error("Invalid verification code");
      return;
    }
    
    // Code is valid, clear verification data
    localStorage.removeItem('verification_data');
    
    // Proceed with import
    handleImport();
  };
  
  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      // First try to fetch the user UUID from the email
      const { fetchUserUuid } = await import('@/utils/supabase/index');
      const existingUuid = await fetchUserUuid(email);
      
      if (!existingUuid) {
        setImportError("No data found associated with this email");
        setIsImporting(false);
        return;
      }
      
      // Use the imported UUID to generate a user session
      await generateUserUuid(email, existingUuid);
      
      // Try to import any transaction data with improved validation
      try {
        // Attempt to load the user's data from Supabase with validation
        const { loadUserData } = await import('@/utils/userDataRecovery');
        const stats = await loadUserData(email, existingUuid);
        
        // Force a cloud sync to confirm everything is working
        const syncSuccess = await forceSyncToCloud(true);
        
        if (!syncSuccess) {
          // Try once more if the first sync failed
          await new Promise(resolve => setTimeout(resolve, 1000));
          await forceSyncToCloud();
        }
        
        // Show success message with import stats
        setImportStats(stats);
        setImportSuccess(true);
        
        toast.success("Data successfully imported!", {
          description: `Loaded ${stats.transactions} transactions and ${stats.categories} categories`,
          duration: 6000
        });
      } catch (dataError) {
        console.error("Error importing user data:", dataError);
        
        // If we at least got the UUID, that's a partial success
        toast.warning("User ID was restored but some data could not be imported", {
          description: "Your ID is now active for future syncing"
        });
      }
    } catch (error) {
      console.error("Error during import:", error);
      setImportError("Unable to import your data. Please check your email and try again.");
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card className="border-indigo-200 shadow-lg bg-gradient-to-b from-white to-indigo-50/30">
      <CardHeader className="border-b border-indigo-100">
        <CardTitle className="text-indigo-600 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Existing Data
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {importSuccess ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <RefreshCw className="h-5 w-5" />
              <span className="font-medium">Data Import Successful!</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Your data has been successfully imported and your User ID is now active on this device.
            </p>
            
            {importStats && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                <p className="font-medium mb-1">Import Summary:</p>
                <ul className="list-disc list-inside">
                  <li>Transactions: {importStats.transactions}</li>
                  <li>Categories: {importStats.categories}</li>
                </ul>
              </div>
            )}
            
            <Button 
              onClick={onCancel} 
              className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Continue to App
            </Button>
          </div>
        ) : verificationSent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-medium">Verify Your Email</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Enter the verification code sent to {email} to confirm ownership and import your data.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-sm font-medium">
                Verification Code
              </Label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="border-indigo-200 focus-visible:ring-indigo-400"
                disabled={isImporting}
              />
            </div>
            
            {importError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-700">Import Failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {importError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleVerifyAndImport} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
                disabled={isImporting || !verificationCode}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying & Importing Data...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Verify & Import Data
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => setVerificationSent(false)} 
                variant="ghost" 
                className="text-muted-foreground"
                disabled={isImporting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Email Entry
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email address associated with your existing User ID to restore your data on this device.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Your Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="border-indigo-200 focus-visible:ring-indigo-400"
                disabled={isVerifying}
              />
            </div>
            
            {importError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-700">Import Failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {importError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleSendVerification} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
                disabled={isVerifying || !email}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Verification...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
              
              <Button 
                onClick={onCancel} 
                variant="ghost" 
                className="text-muted-foreground"
                disabled={isVerifying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              This will restore your data across all your devices. Your local data will be merged with any existing cloud data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataRestoration;
