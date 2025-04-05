
import { useState } from 'react';
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

const ProfilePage = () => {
  const { user, profile, isLoading, signOut, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUpdating, setIsUpdating] = useState(false);

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
    <div className="container py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="mx-auto bg-orange-100 rounded-full p-4">
                <UserIcon className="h-12 w-12 text-orange-600" />
              </div>
              <CardTitle className="text-center mt-2">{profile?.full_name || user?.email}</CardTitle>
              <CardDescription className="text-center">{user?.email}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-slate-300 text-slate-700" 
                onClick={() => signOut()}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">
                    To change your email, please contact support
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
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
            <CardHeader>
              <CardTitle>Data Import & Export</CardTitle>
              <CardDescription>
                Export your data to a CSV file or import from a CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataExportImport />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
