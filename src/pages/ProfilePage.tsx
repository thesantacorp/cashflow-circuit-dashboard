
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DataExportImport from "@/components/DataExportImport";
import NotificationSettings from "@/components/NotificationSettings";
import CurrencySelector from "@/components/CurrencySelector";
import BackupManager from "@/components/BackupManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext"; 
import { useTransactions } from "@/context/transaction";
import { formatDistanceToNow } from "date-fns";

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { lastSyncTime } = useTransactions();

  return (
    <div className="container py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and sync information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
              <p>{user?.email || "Not signed in"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Status</h3>
              <p>{user ? "Active" : "Not signed in"}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Data Sync</h3>
            <p>
              {lastSyncTime 
                ? `${formatDistanceToNow(lastSyncTime, { addSuffix: true })}` 
                : "Not synced yet"}
            </p>
            {lastSyncTime && (
              <p className="text-xs text-muted-foreground mt-1">
                {lastSyncTime.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Settings</CardTitle>
          <CardDescription>Manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CurrencySelector />
          <Separator />
          <DataExportImport />
        </CardContent>
      </Card>

      <BackupManager />

      <NotificationSettings />
    </div>
  );
};

export default ProfilePage;
