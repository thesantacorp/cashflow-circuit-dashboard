
import React from "react";
import { useDataRestoration } from "./DataRestorationProvider";
import EmailForm from "./EmailForm";
import VerificationForm from "./VerificationForm";
import ImportSuccess from "./ImportSuccess";
import ErrorDisplay from "./ErrorDisplay";

interface DataRestorationContentProps {
  onCancel: () => void;
}

const DataRestorationContent: React.FC<DataRestorationContentProps> = ({ onCancel }) => {
  const {
    email,
    setEmail,
    isImporting,
    isVerifying,
    importError,
    importSuccess,
    importStats,
    verificationSent,
    handleSendVerification,
    handleVerifyAndImport
  } = useDataRestoration();

  if (importSuccess) {
    return <ImportSuccess importStats={importStats} onContinue={onCancel} />;
  }
  
  if (verificationSent) {
    return (
      <>
        <VerificationForm 
          email={email}
          onVerifyAndImport={handleVerifyAndImport}
          onBackClick={() => window.location.reload()}
          isImporting={isImporting}
        />
        <ErrorDisplay error={importError} />
      </>
    );
  }
  
  return (
    <>
      <EmailForm 
        email={email}
        onEmailChange={setEmail}
        onSendVerification={handleSendVerification}
        onCancel={onCancel}
        isVerifying={isVerifying}
      />
      <ErrorDisplay error={importError} />
    </>
  );
};

export default DataRestorationContent;
