
// This file contains the code to be deployed as a Supabase Edge Function.
// Copy and paste this code when creating the function in the Supabase dashboard.
/*
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Configure from environment variables first (if set in Supabase)
let SMTP_HOST = Deno.env.get('SMTP_HOST') || '';
let SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || '';
let SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || '';
let SMTP_PORT = Number(Deno.env.get('SMTP_PORT')) || 587;
let FROM_EMAIL = Deno.env.get('FROM_EMAIL') || '';

serve(async (req) => {
  try {
    // Parse the request body
    const { 
      email, 
      subject, 
      message, 
      smtpConfig  // Allow passing SMTP config as part of request
    } = await req.json();
    
    // Check if SMTP settings were provided in the request and use them if env vars aren't set
    if (smtpConfig) {
      SMTP_HOST = SMTP_HOST || smtpConfig.host || '';
      SMTP_USERNAME = SMTP_USERNAME || smtpConfig.username || '';
      SMTP_PASSWORD = SMTP_PASSWORD || smtpConfig.password || '';
      SMTP_PORT = SMTP_PORT || Number(smtpConfig.port) || 587;
      FROM_EMAIL = FROM_EMAIL || smtpConfig.fromEmail || '';
    }
    
    // Log the request (but hide sensitive data)
    console.log(`Processing verification code email request to: ${email}, subject: ${subject}`);
    
    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate that we have all required SMTP settings
    if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD || !FROM_EMAIL) {
      console.error('Missing SMTP configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing SMTP settings',
          details: 'SMTP settings must be provided either as environment variables or in the request'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send the email
    try {
      const client = new SmtpClient();
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USERNAME,
        password: SMTP_PASSWORD,
      });

      await client.send({
        from: FROM_EMAIL,
        to: email,
        subject: subject,
        content: message,
        html: message.replace(/\n/g, '<br>'), // Also send as HTML
      });

      await client.close();
      
      console.log(`Verification code email sent successfully to ${email}`);
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (emailError) {
      console.error('SMTP Error:', emailError);
      return new Response(
        JSON.stringify({ error: `SMTP Error: ${emailError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: `Failed to process request: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
*/

// This file serves as a template/documentation for the Supabase Edge Function
// The actual code needs to be deployed in Supabase, not compiled with your app
export const EDGE_FUNCTION_NAME = 'send-verification-code';

// Instructions for deploying this function in Supabase:
// 1. Go to your Supabase dashboard > Edge Functions
// 2. Create a new function named 'send-verification-code'
// 3. Copy the code from the comment above into the function editor
// 4. Deploy the function
// 5. You can either:
//    a) Set environment variables in your Supabase project:
//       - SMTP_HOST (e.g., smtp.gmail.com)
//       - SMTP_USERNAME (your email address)
//       - SMTP_PASSWORD (your email password or app password)
//       - SMTP_PORT (usually 587)
//       - FROM_EMAIL (the email that will appear in the From field)
//    OR
//    b) Pass the SMTP configuration in your request body:
//       {
//         "email": "recipient@example.com",
//         "subject": "Your Subject",
//         "message": "Your message content",
//         "smtpConfig": {
//           "host": "smtp.gmail.com",
//           "username": "your-email@gmail.com",
//           "password": "your-app-password",
//           "port": 587,
//           "fromEmail": "your-email@gmail.com"
//         }
//       }
