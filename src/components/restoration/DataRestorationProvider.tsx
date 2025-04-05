
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { toast } from "sonner";
import { getSupabaseClient } from "@/utils/supabase/client";

interface DataRestorationContextType {
  email: string;
  setEmail: (email: string) => void;
  isImporting: boolean;
  isVerifying: boolean;
  importError: string | null;
  importSuccess: boolean;
  importStats: {
    transactions: number;
    categories: number;
  } | null;
  verificationSent: boolean;
  handleSendVerification: () => Promise<void>;
  handleVerifyAndImport: (verificationCode: string) => Promise<void>;
  handleImport: () => Promise<void>;
}

export const DataRestorationContext = React.createContext<DataRestorationContextType | undefined>(undefined);

interface DataRestorationProviderProps {
  children: React.ReactNode;
  onCancel: () => void;
}

export const DataRestorationProvider: React.FC<DataRestorationProviderProps> = ({ children, onCancel }) => {
  const { generateUserUuid, forceSyncToCloud } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{
    transactions: number;
    categories: number;
  } | null>(null);
  
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
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      let emailSent = false;
      
      try {
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
        
        try {
          const codeData = {
            code: code,
            email: email,
            expires: Date.now() + (10 * 60 * 1000)
          };
          localStorage.setItem('verification_data', JSON.stringify(codeData));
          
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
        
        const codeData = {
          code: code,
          email: email,
          expires: Date.now() + (10 * 60 * 1000)
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
    
    const storedVerification = localStorage.getItem('verification_data');
    
    if (!storedVerification) {
      toast.error("Verification session expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return;
    }
    
    const verificationData = JSON.parse(storedVerification);
    
    if (Date.now() > verificationData.expires) {
      localStorage.removeItem('verification_data');
      toast.error("Verification code expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return;
    }
    
    if (verificationCode !== verificationData.code || email !== verificationData.email) {
      toast.error("Invalid verification code");
      return;
    }
    
    localStorage.removeItem('verification_data');
    
    handleImport();
  };
  
  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const { fetchUserUuid } = await import('@/utils/supabase/index');
      const existingUuid = await fetchUserUuid(email);
      
      if (!existingUuid) {
        setImportError("No data found associated with this email");
        setIsImporting(false);
        return;
      }
      
      await generateUserUuid(email, existingUuid);
      
      try {
        const { loadUserData } = await import('@/utils/userDataRecovery');
        const stats = await loadUserData(email, existingUuid);
        
        const syncSuccess = await forceSyncToCloud(true);
        
        if (!syncSuccess) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await forceSyncToCloud();
        }
        
        setImportStats(stats);
        setImportSuccess(true);
        
        toast.success("Data successfully imported!", {
          description: `Loaded ${stats.transactions} transactions and ${stats.categories} categories`,
          duration: 6000
        });
      } catch (dataError) {
        console.error("Error importing user data:", dataError);
        
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
  
  const contextValue = {
    email,
    setEmail,
    isImporting,
    isVerifying,
    importError,
    importSuccess,
    importStats,
    verificationSent,
    handleSendVerification,
    handleVerifyAndImport,
    handleImport
  };

  return (
    <DataRestorationContext.Provider value={contextValue}>
      {children}
    </DataRestorationContext.Provider>
  );
};

export const useDataRestoration = () => {
  const context = React.useContext(DataRestorationContext);
  if (context === undefined) {
    throw new Error('useDataRestoration must be used within a DataRestorationProvider');
  }
  return context;
};
