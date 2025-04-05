
import { getSupabaseClient } from "./supabase/client";
import { toast } from "sonner";

// Send email with UUID using Supabase Edge Function
export async function sendEmailWithUuid(email: string, uuid: string): Promise<boolean> {
  try {
    console.log(`Sending UUID ${uuid} to email ${email}...`);
    
    const { error } = await getSupabaseClient().functions.invoke('send-uuid-email', {
      body: { 
        email, 
        uuid,
        subject: 'Your Stack\'d Finance User ID',
        message: `Hello,\n\nThank you for using Stack'd Finance. Your User ID for data recovery is:\n\n${uuid}\n\nPlease keep this ID safe as you will need it to recover your data.\n\nRegards,\nStack'd Finance Team`
      }
    });
    
    if (error) {
      console.error('Error sending email via Supabase function:', error);
      toast.error("Failed to send email with User ID", {
        description: "Please make note of your User ID displayed on screen"
      });
      return false;
    }
    
    toast.success("Email sent successfully", {
      description: "Your User ID has been sent to your email address"
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email with UUID:', error);
    toast.error("Failed to send email with User ID", {
      description: "Please make note of your User ID displayed on screen"
    });
    return false;
  }
}

// Send data recovery link email using Supabase Edge Function
export async function sendDataRecoveryLink(email: string, recoveryLink: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseClient().functions.invoke('send-recovery-email', {
      body: { 
        email,
        recoveryLink,
        subject: 'Stack\'d Finance Data Recovery Link',
        message: `Hello,\n\nHere is your data recovery link for Stack'd Finance:\n\n${recoveryLink}\n\nThis link will expire in 24 hours.\n\nRegards,\nStack'd Finance Team`
      }
    });
    
    if (error) {
      console.error('Error sending recovery link email via Supabase function:', error);
      toast.error("Failed to send recovery link email", {
        description: "Please copy and save the recovery link"
      });
      return false;
    }
    
    toast.success("Recovery link email sent", {
      description: "Please check your email inbox"
    });
    
    return true;
  } catch (error) {
    console.error('Error sending recovery link email:', error);
    toast.error("Failed to send recovery link email");
    return false;
  }
}

// Send verification code via email for data recovery
export async function sendDataRecoveryVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseClient().functions.invoke('send-verification-code', {
      body: { 
        email,
        code,
        subject: 'Stack\'d Finance Verification Code',
        message: `Hello,\n\nYour verification code for Stack'd Finance data recovery is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nRegards,\nStack'd Finance Team`
      }
    });
    
    if (error) {
      console.error('Error sending verification code email via Supabase function:', error);
      toast.error("Failed to send verification code", {
        description: "Please try again later or contact support"
      });
      return false;
    }
    
    toast.success("Verification code sent", {
      description: "Please check your email inbox"
    });
    
    return true;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    return false;
  }
}
