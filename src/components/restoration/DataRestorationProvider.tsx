
import React, { useState, createContext, useContext } from "react";
import { useTransactions } from "@/context/transaction";
import { useVerification } from "./hooks/useVerification";
import { useDataImport } from "./hooks/useDataImport";
import { DataRestorationContextType } from "./types";

export const DataRestorationContext = createContext<DataRestorationContextType | undefined>(undefined);

interface DataRestorationProviderProps {
  children: React.ReactNode;
  onCancel: () => void;
}

export const DataRestorationProvider: React.FC<DataRestorationProviderProps> = ({ children, onCancel }) => {
  const { generateUserUuid, forceSyncToCloud } = useTransactions();
  const [email, setEmail] = useState<string>("");
  
  const {
    verificationSent,
    isVerifying,
    handleSendVerification: sendVerification,
    verifyCode
  } = useVerification();
  
  const {
    isImporting,
    importError,
    importSuccess,
    importStats,
    handleImport: importData,
    setImportError
  } = useDataImport({ generateUserUuid, forceSyncToCloud });
  
  const handleSendVerification = async () => {
    await sendVerification(email);
  };
  
  const handleVerifyAndImport = async (verificationCode: string) => {
    const isVerified = verifyCode(email, verificationCode);
    
    if (isVerified) {
      await handleImport();
    }
  };
  
  const handleImport = async () => {
    await importData(email);
  };
  
  const contextValue: DataRestorationContextType = {
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
  const context = useContext(DataRestorationContext);
  if (context === undefined) {
    throw new Error('useDataRestoration must be used within a DataRestorationProvider');
  }
  return context;
};
