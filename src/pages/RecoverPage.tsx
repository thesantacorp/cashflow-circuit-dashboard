
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { retrieveUserData, applyRecoveredUserData, RecoveryData } from '@/utils/userRecovery';
import { Loader2 } from 'lucide-react';

const RecoverPage: React.FC = () => {
  const { recoveryId } = useParams<{ recoveryId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!recoveryId) {
      setError('No recovery ID provided');
      setLoading(false);
      return;
    }
    
    const data = retrieveUserData(recoveryId);
    if (!data) {
      setError('Invalid or expired recovery link');
    } else {
      setRecoveryData(data);
    }
    
    setLoading(false);
  }, [recoveryId]);
  
  const handleRecoverData = () => {
    if (!recoveryData) return;
    
    setLoading(true);
    const success = applyRecoveredUserData(recoveryData);
    
    if (success) {
      toast.success('Your data has been successfully recovered', {
        description: 'You will be redirected to the home page.'
      });
      
      // Redirect to homepage after a short delay to show the success message
      setTimeout(() => {
        navigate('/');
        // Force a page reload to make sure the app loads the recovered data
        window.location.reload();
      }, 2000);
    } else {
      setError('Failed to recover data. Please try again.');
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-orange-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recover Your Data</CardTitle>
          <CardDescription>
            Use the recovery link to restore your previously saved data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              <p>{error}</p>
              <p className="mt-4 text-sm text-gray-500">
                This recovery link may be invalid, expired, or already used.
              </p>
            </div>
          ) : recoveryData ? (
            <div>
              <p className="mb-4">
                Recovery ID: <span className="font-mono bg-gray-100 p-1 rounded">{recoveryData.readableId}</span>
              </p>
              <p className="mb-2">This will recover the following data:</p>
              <ul className="list-disc list-inside space-y-1 mb-4 pl-2 text-sm">
                <li>{recoveryData.userData.transactions.length} transactions</li>
                <li>{recoveryData.userData.categories.length} categories</li>
                <li>{recoveryData.userData.ideas.length} product ideas</li>
                <li>Your app settings and preferences</li>
              </ul>
              <p className="text-amber-600 text-sm">
                Warning: This will replace your current data with the recovered data.
              </p>
            </div>
          ) : (
            <p className="text-center">No recovery data found.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {recoveryData && (
            <Button onClick={handleRecoverData} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recover My Data
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default RecoverPage;
