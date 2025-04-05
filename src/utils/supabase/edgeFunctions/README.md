
# Email Sending Edge Functions

This document provides instructions for setting up the necessary Supabase Edge Functions for email sending capabilities in the Stack'd Finance application.

## Required Edge Functions

You need to create the following three Edge Functions in your Supabase project:

1. `send-uuid-email` - For sending User IDs
2. `send-recovery-email` - For sending recovery links
3. `send-verification-code` - For sending verification codes

## Implementation Details

### Function Structure

Each function has this basic structure:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Configure your SMTP settings
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
    console.log(`Processing email request to: ${email}, subject: ${subject}`);
    
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
      
      console.log(`Email sent successfully to ${email}`);
      
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
```

### Environment Variables

In your Supabase project settings, you need to add these environment variables:

- `SMTP_HOST` - Your SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_USERNAME` - Your SMTP username/email
- `SMTP_PASSWORD` - Your SMTP password or app password
- `SMTP_PORT` - SMTP port (usually 587 for TLS)
- `FROM_EMAIL` - The email address that will appear in the "From" field

## Deployment Instructions

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to Edge Functions in the left sidebar
4. Click "Create a new function"
5. Name it one of: `send-uuid-email`, `send-recovery-email`, or `send-verification-code`
6. Paste the code from the corresponding file in the `src/utils/supabase/edgeFunctions/` directory
7. Deploy the function
8. Repeat for each of the three required functions

## Setting Environment Variables

1. In your Supabase dashboard, go to Settings > API
2. Scroll down to "Environment Variables"
3. Add each of the required variables:
   - SMTP_HOST
   - SMTP_USERNAME
   - SMTP_PASSWORD
   - SMTP_PORT
   - FROM_EMAIL

## Testing Your Functions

After deployment, you can test your functions:

1. Go to the Edge Functions page
2. Select your function
3. Click on the "Test" tab
4. Enter a test payload:
   ```json
   {
     "email": "your-test-email@example.com",
     "subject": "Test Email",
     "message": "This is a test email from Stack'd Finance"
   }
   ```
5. Click "Run" to test the function

## Troubleshooting

If emails aren't being sent:

1. Check your SMTP settings - many providers require app passwords or allow less secure apps
2. Verify all environment variables are set correctly
3. Check function logs for detailed error messages
4. Try using a different SMTP provider if issues persist
5. If using Gmail, ensure you've created an App Password in your Google Account security settings

## Common SMTP Providers

### Gmail
- SMTP_HOST: smtp.gmail.com
- SMTP_PORT: 587
- Requires App Password if 2FA is enabled

### Outlook/Office365
- SMTP_HOST: smtp.office365.com
- SMTP_PORT: 587

### SendGrid
- SMTP_HOST: smtp.sendgrid.net
- SMTP_PORT: 587

### Mailgun
- SMTP_HOST: smtp.mailgun.org
- SMTP_PORT: 587
