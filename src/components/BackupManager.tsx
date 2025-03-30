
import React, { useEffect } from "react";
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
import { CloudUploadIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const BackupManager: React.FC = () => {
  const { settings, enableBackup, setBackupFrequency, performBackup, restoreBackup, isBackupDue } = useBackup();

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

  const frequencyOptions: { value: BackupFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "manual", label: "Manual only" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-black bg-white flex items-center gap-2">
          <CloudUploadIcon size={16} />
          <span>Backup</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Google Drive Backup</DialogTitle>
          <DialogDescription>
            Backup your transaction data to Google Drive and restore it on any device.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="backup-enabled" className="text-right">
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
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
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
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => performBackup()} className="w-full sm:w-auto">
            <CloudUploadIcon className="mr-2 h-4 w-4" />
            Backup Now
          </Button>
          <Button onClick={() => restoreBackup()} variant="outline" className="w-full sm:w-auto">
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Restore Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackupManager;
