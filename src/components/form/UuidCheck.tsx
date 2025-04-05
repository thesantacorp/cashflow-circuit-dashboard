
import React from "react";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface UuidCheckProps {
  onUuidGenerated?: () => void;
}

const UuidCheck: React.FC<UuidCheckProps> = ({ onUuidGenerated }) => {
  const { userUuid, generateUserUuid } = useTransactions();
  
  const handleGenerateUuid = () => {
    generateUserUuid();
    if (onUuidGenerated) {
      onUuidGenerated();
    }
  };
  
  if (userUuid) {
    return null;
  }
  
  return (
    <Alert className="bg-orange-50 border-orange-300 text-orange-800">
      <KeyRound className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-700 font-semibold">User ID Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You need to generate a unique ID before you can add transactions. This ID will be used to 
          identify your transactions and recover your data if needed.
        </p>
        <Button 
          onClick={handleGenerateUuid}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Generate User ID
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default UuidCheck;
