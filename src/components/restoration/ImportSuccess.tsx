
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ImportSuccessProps {
  importStats: {
    transactions: number;
    categories: number;
  } | null;
  onContinue: () => void;
}

const ImportSuccess: React.FC<ImportSuccessProps> = ({ importStats, onContinue }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <RefreshCw className="h-5 w-5" />
        <span className="font-medium">Data Import Successful!</span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Your data has been successfully imported and your User ID is now active on this device.
      </p>
      
      {importStats && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
          <p className="font-medium mb-1">Import Summary:</p>
          <ul className="list-disc list-inside">
            <li>Transactions: {importStats.transactions}</li>
            <li>Categories: {importStats.categories}</li>
          </ul>
        </div>
      )}
      
      <Button 
        onClick={onContinue} 
        className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white"
      >
        Continue to App
      </Button>
    </div>
  );
};

export default ImportSuccess;
