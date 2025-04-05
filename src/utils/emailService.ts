
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

// Helper function to show email setup error with instructions
function showEmailSetupError() {
  toast.error("Email service not configured", {
    description: "Supabase Edge Functions for sending emails need to be set up",
    duration: 10000,
    action: {
      label: "Setup Guide",
      onClick: () => {
        const setupWindow = window.open("", "_blank");
        if (setupWindow) {
          setupWindow.document.write(`
            <html>
              <head>
                <title>Email Function Setup Guide</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; max-width: 800px; }
                  pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
                  h1, h2 { color: #333; }
                  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                  .steps { margin-left: 20px; }
                  .note { background: #fffde7; padding: 10px; border-left: 4px solid #ffd600; margin: 10px 0; }
                </style>
              </head>
              <body>
                <h1>Server-Side Email Setup Guide</h1>
                <p>To enable email functionality in Stack'd Finance, you need to set up three Supabase Edge Functions with proper environment variables:</p>
                
                <div class="steps">
                  <h2>Step 1: Create the Edge Functions</h2>
                  <ol>
                    <li>Go to your <strong>Supabase Dashboard</strong></li>
                    <li>Select your project</li>
                    <li>In the left sidebar, click on <strong>Edge Functions</strong></li>
                    <li>Create three functions with exactly these names:
                      <ul>
                        <li><code>send-uuid-email</code></li>
                        <li><code>send-recovery-email</code></li>
                        <li><code>send-verification-code</code></li>
                      </ul>
                    </li>
                    <li>Copy the code from the corresponding files in your project:
                      <ul>
                        <li><code>src/utils/supabase/edgeFunctions/send-uuid-email.ts</code></li>
                        <li><code>src/utils/supabase/edgeFunctions/send-recovery-email.ts</code></li>
                        <li><code>src/utils/supabase/edgeFunctions/send-verification-code.ts</code></li>
                      </ul>
                    <li>Make sure to copy only the code inside the comment block (between /* and */)</li>
                  </ol>
                  
                  <h2>Step 2: Configure Environment Variables</h2>
                  <ol>
                    <li>In your Supabase Dashboard, select your project</li>
                    <li>In the left sidebar, click on <strong>Project Settings</strong> (gear/cog icon)</li>
                    <li>Click on <strong>API</strong></li>
                    <li>Scroll down to <strong>Environment Variables</strong></li>
                    <li>Click <strong>+ Add new variable</strong> and add:
                      <ul>
                        <li><code>SMTP_HOST</code> (e.g., smtp.gmail.com)</li>
                        <li><code>SMTP_USERNAME</code> (your email address)</li>
                        <li><code>SMTP_PASSWORD</code> (your email password or app password)</li>
                        <li><code>SMTP_PORT</code> (usually 587)</li>
                        <li><code>FROM_EMAIL</code> (the email address that will appear in the From field)</li>
                      </ul>
                    </li>
                  </ol>
                  
                  <div class="note">
                    <strong>Note for Gmail users:</strong> You'll need to create an "App Password" instead of using your regular password.
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank">Learn how to create an App Password</a>
                  </div>
                  
                  <h2>Step 3: Test Your Setup</h2>
                  <ol>
                    <li>After deploying your functions and setting environment variables, test one function:</li>
                    <li>Go to <strong>Edge Functions</strong>, select one of your functions</li>
                    <li>Click the <strong>Test</strong> tab</li>
                    <li>Enter test data in JSON format:</li>
                    <pre>{
  "email": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message"
}</pre>
                    <li>Click <strong>Run</strong> to test</li>
                  </ol>
                </div>
              </body>
            </html>
          `);
        }
      }
    }
  });
}
