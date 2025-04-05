
import React from "react";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { KeyRound, Star, Rocket } from "lucide-react";
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
      <AlertTitle className="text-orange-700 font-semibold">
        <span className="flex items-center gap-2">
          <Star className="h-4 w-4" /> Never lose your data! 🌟
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3 flex items-start gap-2">
          <Rocket className="h-4 w-4 mt-1 flex-shrink-0" />
          <span>Create Your Unique ID in seconds and make data recovery a breeze! 🚀</span>
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
