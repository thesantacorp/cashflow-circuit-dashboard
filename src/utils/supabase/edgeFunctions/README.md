
# Email Sending Edge Functions

This document provides instructions for setting up the necessary Supabase Edge Functions for email sending capabilities in the Stack'd Finance application.

## Required Edge Functions

You need to create the following three Edge Functions in your Supabase project:

1. `send-uuid-email` - For sending User IDs
2. `send-recovery-email` - For sending recovery links
3. `send-verification-code` - For sending verification codes

## Implementation Details

### Function Structure

Each function should have this basic structure:

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
    
    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send the email
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
    });

    await client.close();
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
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

## Deployment

1. Log in to your Supabase dashboard
2. Go to Edge Functions
3. Create a new function for each of the required functions
4. Copy and customize the template code above
5. Set up the required environment variables
6. Deploy the functions

## Testing

You can test the functions through the Supabase dashboard:

1. Go to Edge Functions
2. Click on your function
3. Under "Invoke" tab, enter a test payload like:
   ```json
   {
     "email": "test@example.com",
     "subject": "Test Email",
     "message": "This is a test email"
   }
   ```
4. Click "Invoke" and check the result
