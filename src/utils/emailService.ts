
import { getSupabaseClient } from "./supabase/client";
import { toast } from "sonner";
import { sendEmailViaSupabase } from "./supabase/edgeFunctions/emailFunctions";
import { verifyEmailFunctionsSetup } from "./supabase/emailFunctionVerification";

// Send email with UUID using Supabase Edge Function
export async function sendEmailWithUuid(email: string, uuid: string): Promise<boolean> {
  try {
    console.log(`Sending UUID ${uuid} to email ${email}...`);
    
    // First verify email functions are set up
    const functionsConfigured = await verifyEmailFunctionsSetup();
    if (!functionsConfigured) {
      console.error('Email functions not configured, cannot send UUID email');
      showEmailSetupError();
      return false;
    }
    
    const success = await sendEmailViaSupabase(
      email,
      'Your Stack\'d Finance User ID',
      `Hello,\n\nThank you for using Stack'd Finance. Your User ID for data recovery is:\n\n${uuid}\n\nPlease keep this ID safe as you will need it to recover your data.\n\nRegards,\nStack'd Finance Team`,
      'send-uuid-email'
    );
    
    if (!success) {
      console.error('Failed to send email with UUID');
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
    // First verify email functions are set up
    const functionsConfigured = await verifyEmailFunctionsSetup();
    if (!functionsConfigured) {
      console.error('Email functions not configured, cannot send recovery link');
      showEmailSetupError();
      return false;
    }
    
    const success = await sendEmailViaSupabase(
      email,
      'Stack\'d Finance Data Recovery Link',
      `Hello,\n\nHere is your data recovery link for Stack'd Finance:\n\n${recoveryLink}\n\nThis link will expire in 24 hours.\n\nRegards,\nStack'd Finance Team`,
      'send-recovery-email'
    );
    
    if (!success) {
      console.error('Failed to send recovery link email');
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
    console.log(`Attempting to send verification code to ${email}`);
    
    // First verify email functions are set up
    const functionsConfigured = await verifyEmailFunctionsSetup();
    if (!functionsConfigured) {
      console.error('Email functions not configured, cannot send verification code');
      showEmailSetupError();
      return false;
    }
    
    const success = await sendEmailViaSupabase(
      email,
      'Stack\'d Finance Verification Code',
      `Hello,\n\nYour verification code for Stack'd Finance data recovery is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nRegards,\nStack'd Finance Team`,
      'send-verification-code'
    );
    
    if (!success) {
      console.error('Failed to send verification code email');
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
    toast.error("Failed to send verification code");
    return false;
  }
}

// Helper function to show email setup error
function showEmailSetupError() {
  toast.error("Email service not configured", {
    description: "Supabase edge functions for sending emails need to be set up",
    duration: 10000,
    action: {
      label: "Show Instructions",
      onClick: () => {
        // Display instructions modal or navigate to setup docs
        const setupWindow = window.open("", "_blank");
        if (setupWindow) {
          setupWindow.document.write(`
            <html>
              <head>
                <title>Email Setup Instructions</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; max-width: 800px; }
                  pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
                  h1, h2 { color: #333; }
                  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                </style>
              </head>
              <body>
                <h1>Email Function Setup Instructions</h1>
                <p>To enable email functionality, you need to set up Supabase Edge Functions.</p>
                <h2>Required Functions</h2>
                <ul>
                  <li><code>send-uuid-email</code> - For sending User IDs</li>
                  <li><code>send-recovery-email</code> - For sending recovery links</li>
                  <li><code>send-verification-code</code> - For sending verification codes</li>
                </ul>
                <p>See the README.md file in src/utils/supabase/edgeFunctions for full instructions.</p>
              </body>
            </html>
          `);
        }
      }
    }
  });
}
