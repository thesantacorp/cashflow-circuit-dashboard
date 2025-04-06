
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FirstLoginAlertProps {
  isFirstLogin: boolean;
}

const FirstLoginAlert: React.FC<FirstLoginAlertProps> = ({ isFirstLogin }) => {
  if (!isFirstLogin) return null;

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">New Device Detected</AlertTitle>
      <AlertDescription className="text-blue-600">
        Existing user just signing in on a new device? Restore data first!
      </AlertDescription>
    </Alert>
  );
};

export default FirstLoginAlert;
