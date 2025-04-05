
import { getSupabaseClient } from "./client";
import { toast } from "sonner";

// Check if email functions are properly configured
export async function verifyEmailFunctionsSetup(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    // Try to invoke a function with minimal data to check if it exists
    const { error } = await supabase.functions.invoke('send-verification-code', {
      body: { test: true }
    });
    
    // Log the response for debugging
    console.log('Email function verification response:', error ? `Error: ${error.message}` : 'Success');
    
    // Check if the error indicates the function doesn't exist
    if (error) {
      if (error.message?.includes('not found') || 
          error.message?.includes('does not exist') || 
          error.status === 404) {
        console.error('Email function not found:', error);
        showEmailFunctionSetupInstructions();
        return false;
      }
      
      // Other errors likely mean the function exists but had parameter issues
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying email functions:', error);
    showEmailFunctionSetupInstructions();
    return false;
  }
}

// Helper to display setup instructions if functions aren't configured
export function showEmailFunctionSetupInstructions(): void {
  toast.error('Email functions not configured', { 
    description: 'Please set up the required Supabase Edge Functions for email sending',
    duration: 10000,
    action: {
      label: 'Setup Guide',
      onClick: () => {
        // Display instructions modal
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
                <h1>Email Function Setup Guide</h1>
                <p>To enable email functionality in Stack'd Finance, you need to set up three Supabase Edge Functions:</p>
                
                <div class="steps">
                  <h2>Step 1: Create the Edge Functions</h2>
                  <ol>
                    <li>Go to your <strong>Supabase Dashboard</strong></li>
                    <li>Navigate to <strong>Edge Functions</strong> in the left sidebar</li>
                    <li>Create the following three functions:
                      <ul>
                        <li><code>send-uuid-email</code> - For sending User IDs</li>
                        <li><code>send-recovery-email</code> - For sending recovery links</li>
                        <li><code>send-verification-code</code> - For sending verification codes</li>
                      </ul>
                    </li>
                    <li>For each function, copy the code from the corresponding file in:
                      <ul>
                        <li><code>src/utils/supabase/edgeFunctions/send-uuid-email.ts</code></li>
                        <li><code>src/utils/supabase/edgeFunctions/send-recovery-email.ts</code></li>
                        <li><code>src/utils/supabase/edgeFunctions/send-verification-code.ts</code></li>
                      </ul>
                    </li>
                    <li>Make sure to copy only the code inside the <code>/*...*/</code> comment block</li>
                  </ol>
                  
                  <h2>Step 2: Configure Environment Variables</h2>
                  <ol>
                    <li>In your Supabase Dashboard, go to <strong>Settings</strong> > <strong>API</strong></li>
                    <li>Scroll to <strong>Environment Variables</strong></li>
                    <li>Add the following variables:
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
                    <strong>Note for Gmail users:</strong> You may need to create an "App Password" instead of using your regular password.
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank">Learn how to create an App Password</a>
                  </div>
                  
                  <h2>Step 3: Deploy and Test</h2>
                  <ol>
                    <li>Deploy each function</li>
                    <li>Return to your Stack'd Finance app</li>
                    <li>Test the email functionality</li>
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
