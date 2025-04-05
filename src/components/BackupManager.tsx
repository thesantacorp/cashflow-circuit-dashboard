
import React from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudIcon, LoaderIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BackupManager: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { isSyncing, backupToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoaderIcon className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to manage backups
        </AlertDescription>
      </Alert>
    );
  }

  const handleBackup = async () => {
    const success = await backupToSupabase();
    if (success && onClose) {
      setTimeout(onClose, 1000);
    }
  };

  const handleRestore = async () => {
    if (window.confirm("This will replace your current data. Are you sure?")) {
      const success = await restoreFromSupabase();
      if (success && onClose) {
        toast.success("Your data has been restored successfully");
        setTimeout(onClose, 1000);
      }
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700">
          <CloudIcon className="mr-2 h-5 w-5" />
          Data Backup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-slate-600">
          Backup or restore your financial data to your Supabase account.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={handleBackup}
          disabled={isSyncing}
          className="border-orange-300 hover:bg-orange-50"
        >
          {isSyncing ? (
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudIcon className="mr-2 h-4 w-4" />
          )}
          Backup Now
        </Button>
        <Button
          variant="outline"
          onClick={handleRestore}
          disabled={isSyncing}
          className="border-orange-300 hover:bg-orange-50"
        >
          {isSyncing ? "Syncing..." : "Restore Data"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BackupManager;
