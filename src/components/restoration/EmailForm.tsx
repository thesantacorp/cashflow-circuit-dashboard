
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

interface EmailFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSendVerification: () => Promise<void>;
  onCancel: () => void;
  isVerifying: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({
  email,
  onEmailChange,
  onSendVerification,
  onCancel,
  isVerifying
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the email address associated with your existing User ID to restore your data on this device.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Your Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter your email address"
          className="border-indigo-200 focus-visible:ring-indigo-400"
          disabled={isVerifying}
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          onClick={onSendVerification} 
          className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
          disabled={isVerifying || !email}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Verification...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Verification Code
            </>
          )}
        </Button>
        
        <Button 
          onClick={onCancel} 
          variant="ghost" 
          className="text-muted-foreground"
          disabled={isVerifying}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        This will restore your data across all your devices. Your local data will be merged with any existing cloud data.
      </p>
    </div>
  );
};

export default EmailForm;
