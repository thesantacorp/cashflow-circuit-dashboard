
// This file contains the code to be deployed as a Supabase Edge Function.
// Copy and paste this code when creating the function in the Supabase dashboard.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Configure your SMTP settings from environment variables
const SMTP_HOST = Deno.env.get('SMTP_HOST') || '';
const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || '';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || '';
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT')) || 587;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

serve(async (req) => {
  try {
    // Parse the request body
    const { email, subject, message } = await req.json();
    
    // Log the request (but hide sensitive data)
    console.log(`Processing verification code email request to: ${email}, subject: ${subject}`);
    
    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate that we have all required environment variables
    if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
      console.error('Missing SMTP configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing SMTP settings' }),
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
