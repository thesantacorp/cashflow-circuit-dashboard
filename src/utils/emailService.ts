
import { getSupabaseClient } from "./supabase/client";
import { toast } from "sonner";
import { sendEmailViaSupabase, setGlobalSmtpConfig } from "./supabase/edgeFunctions/emailFunctions";
import { verifyEmailFunctionsSetup } from "./supabase/emailFunctionVerification";

// Function to set up SMTP configuration
export function setupEmailService(
  host: string, 
  username: string, 
  password: string, 
  fromEmail: string, 
  port = 587
): void {
  setGlobalSmtpConfig({
    host,
    username,
    password,
    port,
    fromEmail
  });
  
  toast.success('Email service configured successfully', {
    description: `SMTP settings for ${host} have been saved`
  });
}

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
      label: "Configure Now",
      onClick: () => {
        // Display email configuration form
        const setupWindow = window.open("", "_blank");
        if (setupWindow) {
          setupWindow.document.write(`
            <html>
              <head>
                <title>Email Setup Configuration</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; max-width: 800px; }
                  .form-group { margin-bottom: 15px; }
                  label { display: block; margin-bottom: 5px; font-weight: bold; }
                  input[type="text"], input[type="password"], input[type="number"] { 
                    width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                  }
                  button { 
                    background: #4f46e5; color: white; border: none; padding: 10px 15px; 
                    border-radius: 4px; cursor: pointer; font-size: 16px; 
                  }
                  button:hover { background: #4338ca; }
                  .note { background: #fffde7; padding: 10px; border-left: 4px solid #ffd600; margin: 10px 0; }
                </style>
              </head>
              <body>
                <h1>Email Service Configuration</h1>
                <p>Configure your SMTP settings to enable email functionality in Stack'd Finance.</p>
                
                <div class="note">
                  <p><strong>Note:</strong> This configuration will be stored in your browser and included with the email requests. 
                  For security, use an app-specific password if your email provider supports it.</p>
                </div>
                
                <form id="smtpForm">
                  <div class="form-group">
                    <label for="host">SMTP Host:</label>
                    <input type="text" id="host" placeholder="e.g., smtp.gmail.com" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="username">SMTP Username (Email):</label>
                    <input type="text" id="username" placeholder="your.email@example.com" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="password">SMTP Password or App Password:</label>
                    <input type="password" id="password" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="port">SMTP Port:</label>
                    <input type="number" id="port" value="587" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="fromEmail">From Email Address:</label>
                    <input type="text" id="fromEmail" placeholder="usually same as username" required>
                  </div>
                  
                  <div class="note">
                    <p><strong>Gmail Users:</strong> You'll need to create an "App Password" instead of using your regular password.
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank">Learn how to create an App Password</a></p>
                  </div>
                  
                  <button type="submit">Save Configuration</button>
                </form>
                
                <script>
                  document.getElementById('smtpForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const config = {
                      host: document.getElementById('host').value,
                      username: document.getElementById('username').value,
                      password: document.getElementById('password').value,
                      port: parseInt(document.getElementById('port').value),
                      fromEmail: document.getElementById('fromEmail').value
                    };
                    
                    // Store in localStorage
                    localStorage.setItem('stackd_smtp_config', JSON.stringify(config));
                    
                    // Send back to parent window through postMessage
                    window.opener.postMessage({
                      type: 'smtp_config',
                      config: config
                    }, '*');
                    
                    // Show success and close window after delay
                    document.body.innerHTML = '<h1>Configuration Saved!</h1><p>You can close this window now. Your email service should be ready to use.</p>';
                    setTimeout(() => window.close(), 3000);
                  });
                  
                  // Auto-fill from localStorage if available
                  const savedConfig = localStorage.getItem('stackd_smtp_config');
                  if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    document.getElementById('host').value = config.host || '';
                    document.getElementById('username').value = config.username || '';
                    document.getElementById('fromEmail').value = config.fromEmail || config.username || '';
                    document.getElementById('port').value = config.port || 587;
                    // Don't pre-fill password for security
                  }
                </script>
              </body>
            </html>
          `);
          
          // Listen for the configuration from the popup
          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'smtp_config') {
              const config = event.data.config;
              setupEmailService(config.host, config.username, config.password, config.fromEmail, config.port);
            }
          });
        }
      }
    }
  });
}

// Check if we have stored SMTP config and use it
export function initEmailService(): void {
  try {
    const savedConfig = localStorage.getItem('stackd_smtp_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.host && config.username && config.password && config.fromEmail) {
        console.log('Found stored SMTP configuration, initializing email service');
        setupEmailService(
          config.host, 
          config.username, 
          config.password, 
          config.fromEmail, 
          config.port || 587
        );
      }
    }
  } catch (error) {
    console.error('Error initializing email service from stored config:', error);
  }
}
