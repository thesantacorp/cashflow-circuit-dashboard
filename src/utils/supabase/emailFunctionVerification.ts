
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
    
    // Function exists but might return an error for invalid parameters
    // That's expected and indicates the function exists
    if (error) {
      if (error.message?.includes('not found') || 
          error.message?.includes('does not exist') || 
          error.status === 404) {
        console.error('Email function not found:', error);
        return false;
      }
      
      // Other errors likely mean the function exists but had parameter issues
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying email functions:', error);
    return false;
  }
}

// Helper to display setup instructions if functions aren't configured
export function showEmailFunctionSetupInstructions(): void {
  toast.error('Email functions not configured', { 
    description: 'Please set up the required Supabase Edge Functions for email sending',
    duration: 10000,
    action: {
      label: 'Learn How',
      onClick: () => {
        window.open('/docs/email-setup', '_blank');
      }
    }
  });
}
