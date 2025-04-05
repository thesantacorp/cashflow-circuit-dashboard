
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, Rocket, Download, Mail, Loader2, Wifi, WifiOff, Star } from "lucide-react";
import { toast } from "sonner";

interface UuidSetupProps {
  onGenerateUuid: (email: string) => Promise<void>;
  onShowRestoration: () => void;
  isGenerating: boolean;
  connectionVerified: boolean;
}

const UuidSetup: React.FC<UuidSetupProps> = ({ 
  onGenerateUuid, 
  onShowRestoration, 
  isGenerating,
  connectionVerified 
}) => {
  const [email, setEmail] = useState<string>("");
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleGenerateClick = async () => {
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    await onGenerateUuid(email);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
        <Star className="h-5 w-5" /> Never lose your data! 🌟
      </h3>
      
      {showEmailInput ? (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
            <Mail className="h-4 w-4" /> Your Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="border-orange-200 focus-visible:ring-orange-400"
          />
          <p className="text-xs text-muted-foreground">
            We'll link this email to your ID for better data recovery options.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-orange-600 mt-1">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Choose Your Option 👇</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            You can generate a new User ID or import your existing data from another device.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <Button 
              onClick={handleGenerateClick} 
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Rocket className="mr-2 h-4 w-4" />
              <span>Generate New User ID</span>
            </Button>
            
            <Button 
              onClick={onShowRestoration} 
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Import Existing Data</span>
            </Button>
          </div>
        </>
      )}
      
      <div className={`flex items-center gap-2 text-sm ${
        connectionVerified ? 'text-green-600' : 'text-amber-600'
      }`}>
        {connectionVerified ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Cloud connection available</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>No cloud connection - ID will be stored locally only</span>
          </>
        )}
      </div>
      
      {showEmailInput && (
        <Button 
          onClick={handleGenerateClick} 
          className="mt-2 bg-orange-500 hover:bg-orange-600 text-white w-full"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Confirm and Generate ID"
          )}
        </Button>
      )}
    </div>
  );
};

export default UuidSetup;
