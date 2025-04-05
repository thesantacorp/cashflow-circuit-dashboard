
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackupFrequency } from "@/types";

interface BackupSettingsProps {
  settings: {
    enabled: boolean;
    frequency: BackupFrequency;
    lastBackup?: number;
  };
  enableBackup: (enabled: boolean) => void;
  setBackupFrequency: (frequency: BackupFrequency) => void;
  handleGoogleSignOut: () => void;
}

const BackupSettingsSection: React.FC<BackupSettingsProps> = ({
  settings,
  enableBackup,
  setBackupFrequency,
  handleGoogleSignOut,
}) => {
  const frequencyOptions: { value: BackupFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "manual", label: "Manual only" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-black font-medium">Signed in to Google Drive</span>
        <Button onClick={handleGoogleSignOut} variant="ghost" size="sm" className="text-black hover:bg-orange-100">
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Label htmlFor="backup-enabled" className="text-right text-black font-medium">
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
          <Label htmlFor="backup-frequency" className="text-black font-medium">Backup Frequency</Label>
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
        <p className="text-sm text-black">
          Last backup: {new Date(settings.lastBackup).toLocaleString()}
        </p>
      )}
    </>
  );
};

export default BackupSettingsSection;
