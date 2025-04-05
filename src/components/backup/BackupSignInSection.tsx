
import React from "react";
import { Button } from "@/components/ui/button";
import { LogInIcon, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BackupSignInSectionProps {
  handleGoogleSignIn: () => void;
}

const BackupSignInSection: React.FC<BackupSignInSectionProps> = ({ 
  handleGoogleSignIn 
}) => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center p-4">
      <p className="text-center text-black font-medium">Sign in with your Google account to enable backups</p>
      <Button 
        onClick={handleGoogleSignIn} 
        className="w-full bg-white text-black border-orange-300 hover:bg-orange-100 hover:text-black" 
        variant="outline"
      >
        <LogInIcon className="mr-2 h-4 w-4" />
        Sign in with Google
      </Button>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="google-setup">
          <AccordionTrigger className="text-sm text-blue-600 flex items-center gap-1">
            <HelpCircle size={14} />
            <span>Getting an error with Google Sign In?</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-sm space-y-2 text-black">
              <p>If you're getting a <strong>"redirect_uri_mismatch"</strong> error, follow these steps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Select your project</li>
                <li>Go to "Credentials" and find the OAuth 2.0 Client ID being used</li>
                <li>Add the following URLs to the "Authorized redirect URIs":
                  <ul className="list-disc pl-5 mt-1">
                    <li><code className="bg-gray-100 px-1 rounded">http://localhost:5173</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">http://localhost:4173</code></li>
                    <li>Your deployed app URL (if applicable)</li>
                  </ul>
                </li>
                <li>Click "Save" and try again</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default BackupSignInSection;
