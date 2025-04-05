
import { getSupabaseClient } from "../client";
import { toast } from "sonner";
import { verifyEmailFunctionsSetup } from "../emailFunctionVerification";

// SMTP Configuration type
export interface SmtpConfig {
  host: string;
  username: string;
  password: string;
  port?: number;
  fromEmail: string;
}

// Helper function to send an email through Supabase Edge Function
export async function sendEmailViaSupabase(
  recipient: string, 
  subject: string, 
  body: string,
  functionName: 'send-email' | 'send-recovery-email' | 'send-verification-code'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // First verify that email functions are configured
  const functionsConfigured = await verifyEmailFunctionsSetup();
  
  if (!functionsConfigured) {
    console.error(`Email function ${functionName} is not properly configured`);
    toast.error('Email functions not configured', {
      description: 'Please check your Supabase Edge Functions setup'
    });
    return false;
  }
  
  try {
    console.log(`Invoking email function: ${functionName}`, {
      email: recipient,
      subject: subject
    });
    
    // Prepare the request payload
    const payload = { 
      email: recipient,
      subject,
      message: body
    };
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    console.log(`Email function response:`, data || error);
    
    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      toast.error(`Failed to send email`, {
        description: error.message || 'Check console for details'
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception in ${functionName}:`, error);
    toast.error('Email sending failed', { 
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
}

// Export function to verify email functions
export async function verifyEmailFunctionsExist(): Promise<boolean> {
  try {
    return await verifyEmailFunctionsSetup();
  } catch (error) {
    console.error('Error verifying email functions:', error);
    return false;
  }
}
