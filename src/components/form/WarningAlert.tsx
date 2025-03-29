
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface WarningAlertProps {
  message: string;
}

const WarningAlert: React.FC<WarningAlertProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">{message}</AlertDescription>
    </Alert>
  );
};

export default WarningAlert;
