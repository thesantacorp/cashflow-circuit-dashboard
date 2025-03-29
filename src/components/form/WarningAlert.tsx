
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface WarningAlertProps {
  message: string;
}

const WarningAlert: React.FC<WarningAlertProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default WarningAlert;
