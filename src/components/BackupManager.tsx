
import React, { useEffect, useState } from "react";
import { useBackup } from "@/context/BackupContext";
import { BackupFrequency } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUploadIcon, RefreshCwIcon, LogInIcon, LogOutIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BackupManager: React.FC = () => {
  const { 
    settings, 
    enableBackup, 
    setBackupFrequency, 
    performBackup, 
    restoreBackup, 
    isBackupDue,
    isAuthenticated,
    handleGoogleSignIn,
    handleGoogleSignOut
  } = useBackup();
  
  const isMobile = useIsMobile();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if backup is due every time the component mounts
  useEffect(() => {
    const checkBackup = () => {
      if (settings.enabled && isBackupDue()) {
        toast("Backup is due", {
          description: "Your data backup is due according to your schedule",
          action: {
            label: "Backup now",
            onClick: () => performBackup(),
          },
        });
      }
    };
    
    checkBackup();
    
    // Set a daily check for backups
    const intervalId = setInterval(checkBackup, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings, isBackupDue, performBackup]);
  
  // Perform automatic backup if daily is selected and a day has passed
  useEffect(() => {
    const autoBackup = async () => {
      if (settings.enabled && isAuthenticated && isBackupDue()) {
        try {
          await performBackup();
          toast.success("Automatic backup completed successfully");
        } catch (error) {
          console.error("Automatic backup failed:", error);
          toast.error("Automatic backup failed. We'll try again later.");
        }
      }
    };
    
    // Check for auto backup on component mount
    autoBackup();
    
    // Also set up an interval to check regularly (every 6 hours)
    const intervalId = setInterval(autoBackup, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings, isAuthenticated, isBackupDue, performBackup]);

  const frequencyOptions: { value: BackupFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "manual", label: "Manual only" },
  ];

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await performBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsRestoring(true);
    try {
      await restoreBackup();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-black bg-white flex items-center gap-2">
          <CloudUploadIcon size={16} />
          <span>{isMobile ? "" : "Backup"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Google Drive Backup</DialogTitle>
          <DialogDescription>
            Backup your transaction data to Google Drive and restore it on any device.
            Your backups are stored in a folder named "StackdBackups" in your Google Drive.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-4 items-center justify-center p-4">
              <p className="text-center text-black">Sign in with your Google account to enable backups</p>
              <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
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
                    <div className="text-sm space-y-2">
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
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Signed in to Google Drive</span>
                <Button onClick={handleGoogleSignOut} variant="ghost" size="sm">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="backup-enabled" className="text-right text-black">
                  Enable Automatic Backup
                </Label>
                <input
                  id="backup-enabled"
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => enableBackup(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              
              {settings.enabled && (
                <div className="grid gap-2">
                  <Label htmlFor="backup-frequency" className="text-black">Backup Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(value) => setBackupFrequency(value as BackupFrequency)}
                  >
                    <SelectTrigger id="backup-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {settings.lastBackup && (
                <p className="text-sm text-muted-foreground">
                  Last backup: {new Date(settings.lastBackup).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleBackupNow} 
            className="w-full sm:w-auto"
            disabled={!isAuthenticated || isBackingUp}
          >
            {isBackingUp ? (
              <>
                <span className="animate-spin mr-2">
                  <RefreshCwIcon className="h-4 w-4" />
                </span>
                Backing up...
              </>
            ) : (
              <>
                <CloudUploadIcon className="mr-2 h-4 w-4" />
                Backup Now
              </>
            )}
          </Button>
          <Button 
            onClick={handleRestoreBackup} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={!isAuthenticated || isRestoring}
          >
            {isRestoring ? (
              <>
                <span className="animate-spin mr-2">
                  <RefreshCwIcon className="h-4 w-4" />
                </span>
                Restoring...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Restore Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackupManager;
