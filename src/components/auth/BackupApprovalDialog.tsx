
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LoaderIcon, CloudIcon, ShieldIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Custom Google icon component
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    {...props}
  >
    <path
      fill="currentColor"
      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
    />
  </svg>
);

const BackupApprovalDialog = () => {
  const [isApproving, setIsApproving] = useState(false);
  const { updateBackupApproval } = useAuth();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Simulate OAuth approval flow
      setTimeout(async () => {
        try {
          // Update the user's profile to mark backup as approved
          await updateBackupApproval(true);
        } catch (error) {
          console.error('Error approving backup:', error);
          toast.error('Failed to approve backup');
        } finally {
          setIsApproving(false);
        }
      }, 1500);
    } catch (error) {
      setIsApproving(false);
      toast.error('Failed to connect to Google Drive');
      console.error('Google Drive connection error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <CloudIcon className="mr-2 h-6 w-6 text-orange-500" />
            Approve Automatic Backups
          </CardTitle>
          <CardDescription>
            Secure your financial data with daily automatic backups
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <p className="text-sm text-slate-700">
              Stack'd needs your permission to securely back up your financial data. 
              This ensures that your transactions and categories are always safe.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <ShieldIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Secure & Private</h3>
                <p className="text-xs text-slate-500">Your data is encrypted and stored securely</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <CloudIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Daily Automatic Backups</h3>
                <p className="text-xs text-slate-500">Your data is backed up every 24 hours</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isApproving}
            onClick={handleApprove}
          >
            {isApproving ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Approve Backup with Google
              </>
            )}
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            By approving, you allow Stack'd to automatically back up your financial data.
            You can disable this feature anytime in settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BackupApprovalDialog;
