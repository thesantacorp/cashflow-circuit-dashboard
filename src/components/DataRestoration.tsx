
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  KeyRound, Download, Mail, Loader2, 
  CloudOff, RefreshCw, AlertTriangle, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DataRestorationProps {
  onCancel: () => void;
}

const DataRestoration: React.FC<DataRestorationProps> = ({ onCancel }) => {
  const { generateUserUuid, forceSyncToCloud } = useTransactions();
  const [email, setEmail] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{
    transactions: number;
    categories: number;
  } | null>(null);
  
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleImport = async () => {
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      // First try to fetch the user UUID from the email
      const { fetchUserUuid } = await import('@/utils/supabase/index');
      const existingUuid = await fetchUserUuid(email);
      
      if (!existingUuid) {
        setImportError("No data found associated with this email");
        setIsImporting(false);
        return;
      }
      
      // Use the imported UUID to generate a user session
      await generateUserUuid(email, existingUuid);
      
      // Try to import any transaction data
      try {
        // Attempt to load the user's data from Supabase
        const { loadUserData } = await import('@/utils/userDataRecovery');
        const stats = await loadUserData(email, existingUuid);
        
        // Force a cloud sync to confirm everything is working
        await forceSyncToCloud();
        
        // Show success message with import stats
        setImportStats(stats);
        setImportSuccess(true);
        
        toast.success("Data successfully imported!", {
          description: `Loaded ${stats.transactions} transactions and ${stats.categories} categories`,
          duration: 6000
        });
      } catch (dataError) {
        console.error("Error importing user data:", dataError);
        
        // If we at least got the UUID, that's a partial success
        toast.warning("User ID was restored but some data could not be imported", {
          description: "Your ID is now active for future syncing"
        });
      }
    } catch (error) {
      console.error("Error during import:", error);
      setImportError("Unable to import your data. Please check your email and try again.");
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card className="border-indigo-200 shadow-lg bg-gradient-to-b from-white to-indigo-50/30">
      <CardHeader className="border-b border-indigo-100">
        <CardTitle className="text-indigo-600 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Existing Data
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {importSuccess ? (
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
              onClick={onCancel} 
              className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Continue to App
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email address associated with your existing User ID to restore your data on this device.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Your Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="border-indigo-200 focus-visible:ring-indigo-400"
                disabled={isImporting}
              />
            </div>
            
            {importError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-700">Import Failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {importError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleImport} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
                disabled={isImporting || !email}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Data...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import My Data
                  </>
                )}
              </Button>
              
              <Button 
                onClick={onCancel} 
                variant="ghost" 
                className="text-muted-foreground"
                disabled={isImporting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              This will restore your data across all your devices. Your local data will be merged with any existing cloud data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataRestoration;
