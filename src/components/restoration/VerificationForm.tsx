
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface VerificationFormProps {
  email: string;
  onVerifyAndImport: (verificationCode: string) => Promise<void>;
  onBackClick: () => void;
  isImporting: boolean;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  email,
  onVerifyAndImport,
  onBackClick,
  isImporting
}) => {
  const [verificationCode, setVerificationCode] = useState<string>("");
  
  const handleSubmit = () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }
    
    onVerifyAndImport(verificationCode);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-indigo-600">
        <ShieldCheck className="h-5 w-5" />
        <span className="font-medium">Verify Your Email</span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Enter the verification code sent to {email} to confirm ownership and import your data.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="verificationCode" className="text-sm font-medium">
          Verification Code
        </Label>
        <Input
          id="verificationCode"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="border-indigo-200 focus-visible:ring-indigo-400"
          disabled={isImporting}
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          onClick={handleSubmit} 
          className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
          disabled={isImporting || !verificationCode}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying & Importing Data...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Verify & Import Data
            </>
          )}
        </Button>
        
        <Button 
          onClick={onBackClick} 
          variant="ghost" 
          className="text-muted-foreground"
          disabled={isImporting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email Entry
        </Button>
      </div>
    </div>
  );
};

export default VerificationForm;
