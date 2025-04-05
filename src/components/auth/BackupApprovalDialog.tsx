
import React, { useState } from 'react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CloudIcon, LoaderIcon } from 'lucide-react';

const BackupApprovalDialog = () => {
  const [open, setOpen] = useState(false);
  const { isSyncing, backupToSupabase, restoreFromSupabase } = useSupabaseSync();
  const { user } = useAuth();
  const [action, setAction] = useState<'backup' | 'restore' | null>(null);

  // Show dialog when user has logged in and there's data to sync
  React.useEffect(() => {
    if (user && localStorage.getItem('lastTransactionUpdate')) {
      setOpen(true);
    }
  }, [user]);

  const handleApprove = async () => {
    if (action === 'backup') {
      await backupToSupabase();
    } else if (action === 'restore') {
      await restoreFromSupabase();
    }
    setOpen(false);
  };

  const handleDecline = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CloudIcon className="mr-2 h-5 w-5 text-orange-500" />
            Sync Your Data
          </DialogTitle>
          <DialogDescription>
            Would you like to backup your local data to your account or restore from your last backup?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 py-4">
          <Button
            variant="outline"
            className={`flex-1 ${action === 'backup' ? 'border-orange-500 bg-orange-50' : ''}`}
            onClick={() => setAction('backup')}
          >
            Backup Local Data
          </Button>
          <Button 
            variant="outline"
            className={`flex-1 ${action === 'restore' ? 'border-orange-500 bg-orange-50' : ''}`}
            onClick={() => setAction('restore')}
          >
            Restore from Cloud
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={handleDecline}>
            Skip For Now
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={!action || isSyncing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSyncing ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackupApprovalDialog;
