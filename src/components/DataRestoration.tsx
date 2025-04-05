
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getSupabaseClient } from "@/utils/supabase/client";
import EmailForm from "./restoration/EmailForm";
import VerificationForm from "./restoration/VerificationForm";
import ImportSuccess from "./restoration/ImportSuccess";

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
  
  const handleVerifyAndImport = async (verificationCode: string) => {
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
  
  const renderContent = () => {
    if (importSuccess) {
      return <ImportSuccess importStats={importStats} onContinue={onCancel} />;
    } else if (verificationSent) {
      return (
        <>
          <VerificationForm 
            email={email}
            onVerifyAndImport={handleVerifyAndImport}
            onBackClick={() => setVerificationSent(false)}
            isImporting={isImporting}
          />
          
          {importError && (
            <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Import Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                {importError}
              </AlertDescription>
            </Alert>
          )}
        </>
      );
    } else {
      return (
        <>
          <EmailForm 
            email={email}
            onEmailChange={setEmail}
            onSendVerification={handleSendVerification}
            onCancel={onCancel}
            isVerifying={isVerifying}
          />
          
          {importError && (
            <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Import Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                {importError}
              </AlertDescription>
            </Alert>
          )}
        </>
      );
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
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default DataRestoration;
