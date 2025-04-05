
import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useTransactions } from "@/context/transaction";

// Define a simple context type
interface DataRestorationContextType {
  email: string;
  setEmail: (email: string) => void;
  isVerifying: boolean;
  setIsVerifying: (isVerifying: boolean) => void;
  isImporting: boolean;
  setIsImporting: (isImporting: boolean) => void;
  importStats: { transactions: number; categories: number } | null;
  setImportStats: (stats: { transactions: number; categories: number } | null) => void;
  importSuccess: boolean;
  setImportSuccess: (success: boolean) => void;
  verificationSent: boolean;
  setVerificationSent: (sent: boolean) => void;
  handleSendVerification: () => Promise<void>;
  handleVerifyAndImport: (code: string) => Promise<void>;
}

// Create context with default values
const DataRestorationContext = createContext<DataRestorationContextType | undefined>(undefined);

// Hook for components to use the context
export const useDataRestoration = () => {
  const context = useContext(DataRestorationContext);
  if (!context) {
    throw new Error("useDataRestoration must be used within a DataRestorationProvider");
  }
  return context;
};

interface DataRestorationProviderProps {
  children: ReactNode;
  onCancel: () => void;
}

export const DataRestorationProvider: React.FC<DataRestorationProviderProps> = ({ 
  children,
  onCancel
}) => {
  // Basic state for the data restoration flow
  const [email, setEmail] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{ transactions: number; categories: number } | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  
  // Get transaction context for import operations
  const { importData } = useTransactions();

  // Mock function to handle sending verification
  const handleSendVerification = async () => {
    setIsVerifying(true);
    
    try {
      // Simply show a success message since we're not implementing actual verification
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success("Verification code sent", {
        description: "Please check your email"
      });
      
      setVerificationSent(true);
    } catch (error) {
      toast.error("Failed to send verification", {
        description: "Please try again"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Mock function to handle verification and import
  const handleVerifyAndImport = async (code: string) => {
    if (!code) {
      toast.error("Please enter a verification code");
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Simulate verification and data fetching delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock imported data
      const mockImportedData = {
        transactions: [
          {
            id: "mock-1",
            amount: 100,
            categoryId: "cat-1",
            description: "Mock Transaction",
            date: new Date().toISOString(),
            type: "expense" as const
          }
        ],
        categories: [
          {
            id: "cat-1",
            name: "Mock Category",
            type: "expense" as const,
            color: "#ff5500"
          }
        ]
      };
      
      // Import the mock data
      importData(mockImportedData);
      
      // Set import stats
      setImportStats({
        transactions: mockImportedData.transactions.length,
        categories: mockImportedData.categories.length
      });
      
      setImportSuccess(true);
      
      toast.success("Data import successful", {
        description: "Your data has been restored"
      });
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const value = {
    email,
    setEmail,
    isVerifying,
    setIsVerifying,
    isImporting,
    setIsImporting,
    importStats,
    setImportStats,
    importSuccess,
    setImportSuccess,
    verificationSent,
    setVerificationSent,
    handleSendVerification,
    handleVerifyAndImport
  };

  return (
    <DataRestorationContext.Provider value={value}>
      {children}
    </DataRestorationContext.Provider>
  );
};
