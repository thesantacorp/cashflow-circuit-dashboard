
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-800">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-700">Import Failed</AlertTitle>
      <AlertDescription className="text-red-700">
        {error}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
