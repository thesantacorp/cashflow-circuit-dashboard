
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { LoaderIcon, UserIcon, LogOutIcon } from 'lucide-react';
import SupabaseSync from '@/components/SupabaseSync';
import DataExportImport from '@/components/DataExportImport';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
  const { user, profile, isLoading, signOut, updateProfile } = useAuth();
  const { lastSyncDate } = useSupabaseSync();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [formattedSyncTime, setFormattedSyncTime] = useState<string | null>(null);

  useEffect(() => {
    if (lastSyncDate) {
      setFormattedSyncTime(formatDistanceToNow(lastSyncDate, { addSuffix: true }));
    }
  }, [lastSyncDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderIcon className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      await updateProfile({
        full_name: fullName
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-4 md:py-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Profile Settings</h1>
      
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {/* Profile card - made more compact on mobile */}
        <div className="md:col-span-1">
          <Card className="h-auto">
            <CardHeader className="p-4 md:p-6">
              <div className="mx-auto bg-orange-100 rounded-full p-3 md:p-4">
                <UserIcon className="h-8 w-8 md:h-12 md:w-12 text-orange-600" />
              </div>
              <CardTitle className="text-center mt-2 text-lg md:text-xl">
                {profile?.full_name || user?.email}
              </CardTitle>
              <CardDescription className="text-center text-sm break-words">
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-0">
              {formattedSyncTime && (
                <div className="text-sm text-center text-muted-foreground pb-3">
                  Last synced: {formattedSyncTime}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 md:p-6">
              <Button 
                variant="outline" 
                className="w-full border-slate-300 text-slate-700" 
                onClick={() => signOut()}
                size="sm"
              >
                <LogOutIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Settings cards - more compact on mobile */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Personal Information</CardTitle>
              <CardDescription className="text-sm">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <form onSubmit={handleUpdateProfile} className="space-y-3 md:space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50 h-9 md:h-10"
                  />
                  <p className="text-xs text-slate-500">
                    To change your email, please contact support
                  </p>
                </div>
                
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="h-9 md:h-10"
                  />
                </div>
                
                <div className="pt-1 md:pt-2">
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 h-9 md:h-10"
                    disabled={isUpdating}
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <LoaderIcon className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <SupabaseSync />
          
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Data Import & Export</CardTitle>
              <CardDescription className="text-sm">
                Export your data to a CSV file or import from a CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <DataExportImport />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
