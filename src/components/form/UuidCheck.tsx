
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Star, Rocket, Mail, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface UuidCheckProps {
  onUuidGenerated?: () => void;
}

const UuidCheck: React.FC<UuidCheckProps> = ({ onUuidGenerated }) => {
  const { userUuid, generateUserUuid, connectionVerified } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
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
    setErrorMessage("");
    
    try {
      if (!connectionVerified) {
        // Check if we can connect to the database
        const { checkSupabaseConnection } = await import('@/utils/supabaseInit');
        const isConnected = await checkSupabaseConnection();
        
        if (!isConnected) {
          setErrorMessage("Cannot connect to database. Your User ID will be stored locally only.");
          toast.warning("Cannot connect to database", {
            description: "Your User ID will be stored locally. You can sync it later when connection is available."
          });
        }
      }
      
      await generateUserUuid(email);
      if (onUuidGenerated) {
        onUuidGenerated();
      }
    } catch (error) {
      console.error("Error generating UUID:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("Content-Type not acceptable")) {
        setErrorMessage("Database connection issue: Content-Type not acceptable. Please try again later.");
        toast.error("Database connection issue", {
          description: "Content-Type error. Your User ID will be stored locally for now."
        });
      } else {
        setErrorMessage(`Error: ${errorMsg}`);
        toast.error("Failed to generate User ID", {
          description: "Please try again later"
        });
      }
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
        
        {errorMessage && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}
        
        {showEmailInput ? (
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
            <p className="text-xs text-gray-600">
              Your ID will be stored securely for future data recovery and sent to your email
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Button 
              onClick={handleGenerateUuid}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Rocket className="mr-2 h-4 w-4" />
              <span>Generate New User ID</span>
            </Button>
            
            <Link to="/#user-id-section" className="inline-block">
              <Button 
                onClick={() => window.location.href = '/#user-id-section'} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Import Existing Data</span>
              </Button>
            </Link>
          </div>
        )}
        
        {showEmailInput && (
          <Button 
            onClick={handleGenerateUuid}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate User ID
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default UuidCheck;
