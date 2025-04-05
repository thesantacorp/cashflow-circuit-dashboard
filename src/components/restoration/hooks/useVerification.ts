
import { useState } from "react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/utils/supabase/client";
import { VerificationData } from "../types";
import { sendDataRecoveryVerificationCode } from "@/utils/emailService";

export function useVerification() {
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleSendVerification = async (email: string) => {
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    setIsVerifying(true);
    
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code securely in localStorage with expiration
      const codeData: VerificationData = {
        code: code,
        email: email,
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes expiration
      };
      localStorage.setItem('verification_data', JSON.stringify(codeData));
      
      // Send verification code via email service
      const emailSent = await sendDataRecoveryVerificationCode(email, code);
      
      if (emailSent) {
        toast.success("Verification code sent", {
          description: "Please check your email for the verification code"
        });
        setVerificationSent(true);
        return true;
      } else {
        toast.error("Could not send verification email", {
          description: "Please try again later or contact support"
        });
        return false;
      }
    } catch (error) {
      console.error("Error in verification process:", error);
      toast.error("Failed to start verification process");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };
  
  const verifyCode = (email: string, verificationCode: string): boolean => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return false;
    }
    
    const storedVerification = localStorage.getItem('verification_data');
    
    if (!storedVerification) {
      toast.error("Verification session expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return false;
    }
    
    const verificationData = JSON.parse(storedVerification);
    
    if (Date.now() > verificationData.expires) {
      localStorage.removeItem('verification_data');
      toast.error("Verification code expired", {
        description: "Please request a new code"
      });
      setVerificationSent(false);
      return false;
    }
    
    if (verificationCode !== verificationData.code || email !== verificationData.email) {
      toast.error("Invalid verification code");
      return false;
    }
    
    localStorage.removeItem('verification_data');
    return true;
  };
  
  return {
    verificationSent,
    setVerificationSent,
    isVerifying,
    setIsVerifying,
    handleSendVerification,
    verifyCode
  };
}
