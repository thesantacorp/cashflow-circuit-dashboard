
import React from "react";
import EmailForm from "./EmailForm";
import VerificationForm from "./VerificationForm";
import ImportSuccess from "./ImportSuccess";
import ErrorDisplay from "./ErrorDisplay";
import { useDataRestoration } from "./DataRestorationProvider";

interface DataRestorationContentProps {
  onCancel: () => void;
}

const DataRestorationContent: React.FC<DataRestorationContentProps> = ({
  onCancel
}) => {
  const {
    email,
    setEmail,
    isVerifying,
    isImporting,
    importSuccess,
    importStats,
    verificationSent,
    handleSendVerification,
    handleVerifyAndImport,
    setVerificationSent
  } = useDataRestoration();
  
  // Step back from verification form to email form
  const handleBackClick = () => {
    setVerificationSent(false);
  };

  return (
    <div className="space-y-6">
      {!importSuccess && !verificationSent && (
        <EmailForm
          email={email}
          onEmailChange={setEmail}
          onSendVerification={handleSendVerification}
          onCancel={onCancel}
          isVerifying={isVerifying}
        />
      )}
      
      {!importSuccess && verificationSent && (
        <VerificationForm
          email={email}
          onVerifyAndImport={handleVerifyAndImport}
          onBackClick={handleBackClick}
          isImporting={isImporting}
        />
      )}
      
      {importSuccess && (
        <ImportSuccess
          importStats={importStats}
          onContinue={onCancel}
        />
      )}
      
      {/* Error display component is included but not used in this simplified version */}
      <ErrorDisplay error={null} />
    </div>
  );
};

export default DataRestorationContent;
