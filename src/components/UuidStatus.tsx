
import React from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Check, AlertCircle } from "lucide-react";

const UuidStatus: React.FC = () => {
  const { userUuid, generateUserUuid } = useTransactions();

  return (
    <Card className="border-orange-200 shadow-lg bg-gradient-to-b from-white to-orange-50/30">
      <CardHeader className="border-b border-orange-100">
        <CardTitle className="text-orange-600 flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          User ID Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {userUuid ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">User ID is active</span>
            </div>
            <div className="text-sm text-muted-foreground break-all">
              <span className="font-medium">Your ID:</span> {userUuid}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your transactions are securely linked to this ID. Keep it safe for data recovery.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">No User ID detected</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You need to generate a unique ID before you can add transactions.
              This ID will be used to identify your transactions and recover your data if needed.
            </p>
            <Button 
              onClick={generateUserUuid} 
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              Generate User ID
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UuidStatus;
