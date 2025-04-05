
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Star, Rocket, Mail } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface UuidCheckProps {
  onUuidGenerated?: () => void;
}

const UuidCheck: React.FC<UuidCheckProps> = ({ onUuidGenerated }) => {
  const { userUuid, generateUserUuid } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleGenerateUuid = async () => {
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await generateUserUuid(email);
      if (onUuidGenerated) {
        onUuidGenerated();
      }
    } catch (error) {
      console.error("Error generating UUID:", error);
      toast.error("Failed to generate User ID. Please try again.");
    } finally {
      setIsGenerating(false);
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
        
        {showEmailInput && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1 text-sm">
              <Mail className="h-4 w-4" />
              <span>Enter your email address:</span>
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="border-orange-200 focus-visible:ring-orange-400 mb-2"
            />
          </div>
        )}
        
        <Button 
          onClick={handleGenerateUuid}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isGenerating}
        >
          {isGenerating 
            ? "Generating..." 
            : showEmailInput 
              ? "Confirm and Generate ID" 
              : "Generate User ID"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default UuidCheck;
