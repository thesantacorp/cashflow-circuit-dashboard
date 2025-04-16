
import React from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTransactions } from "@/context/transaction";
import NetworkStatusIndicator from "./NetworkStatusIndicator";

const LocalStorageInfo: React.FC = () => {
  const { isOnline } = useTransactions();

  return (
    <div className="mt-6">
      <NetworkStatusIndicator />
      <Alert className="mt-3 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          Your data is securely stored in the cloud database.
          {!isOnline && " Currently in offline mode, please reconnect to continue managing your transactions."}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LocalStorageInfo;
