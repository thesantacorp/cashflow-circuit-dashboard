
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Clock, Rocket, Zap, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UuidFormProps {
  onGenerateUuid: (email: string) => Promise<void>;
}

const UuidForm: React.FC<UuidFormProps> = ({ onGenerateUuid }) => {
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
      await onGenerateUuid(email);
      setShowEmailInput(false);
      setEmail("");
    } catch (error) {
      console.error("Error generating UUID:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
        <Star className="h-5 w-5" /> Never lose your data! 🌟
      </h3>
      
      <div className="flex items-center gap-2 text-orange-600 mt-1">
        <Clock className="h-5 w-5" />
        <span className="font-medium">Create Your Unique ID in Seconds! ⏱️</span>
      </div>
      
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <Rocket className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>Your ID makes data recovery a breeze. Let's get you set up in no time! 🚀</span>
      </p>
      
      {showEmailInput ? (
        <div className="space-y-2 mt-2">
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
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Simply bind your email and you're all set up 🎉</span>
        </p>
      )}
      
      <Button 
        onClick={handleGenerateUuid} 
        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white w-full"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : showEmailInput ? (
          "Confirm and Generate ID"
        ) : (
          "Generate User ID"
        )}
      </Button>
    </div>
  );
};

export default UuidForm;
