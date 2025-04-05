
import { toast } from "sonner";

// In a real production environment, this would connect to a backend service
// Since we can't directly send emails from the frontend, we'll simulate the email sending process
// and provide clear instructions to the user

export async function sendEmailWithUuid(email: string, uuid: string): Promise<boolean> {
  try {
    console.log(`Sending UUID ${uuid} to email ${email}...`);
    
    // For now, we'll use the mailto: protocol as a fallback
    const subject = encodeURIComponent('Your Stack\'d Finance User ID');
    const body = encodeURIComponent(
      `Hello,\n\nThank you for using Stack'd Finance. Your User ID for data recovery is:\n\n${uuid}\n\nPlease keep this ID safe as you will need it to recover your data.\n\nRegards,\nStack'd Finance Team`
    );
    
    // Open email client
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    
    // In a real scenario, we would call a backend API to send the email
    // For now, we'll consider this a "successful" send since we've opened the user's email client
    // This is a temporary solution until we implement a proper backend email service
    
    // Display clear instructions to the user about what's happening
    toast.info("Email client opened", {
      description: "We've opened your email client with your User ID. If it didn't open automatically, please make note of your ID.",
      duration: 10000
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

// This would be implemented with a proper backend in production
export async function sendDataRecoveryLink(email: string, recoveryLink: string): Promise<boolean> {
  try {
    const subject = encodeURIComponent('Stack\'d Finance Data Recovery Link');
    const body = encodeURIComponent(
      `Hello,\n\nHere is your data recovery link for Stack'd Finance:\n\n${recoveryLink}\n\nThis link will expire in 24 hours.\n\nRegards,\nStack'd Finance Team`
    );
    
    // Open email client
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    
    toast.info("Email client opened", {
      description: "We've opened your email client with your recovery link. If it didn't open automatically, please make note of the link.",
      duration: 8000
    });
    
    return true;
  } catch (error) {
    console.error('Error sending recovery link email:', error);
    return false;
  }
}
