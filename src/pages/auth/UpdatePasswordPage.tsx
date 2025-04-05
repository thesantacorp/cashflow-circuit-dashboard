
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderIcon, ShieldCheckIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (if the user accessed this page via a password reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and no hash in URL, redirect to login
      if (!session && !window.location.hash) {
        toast.error('Invalid or expired password reset link');
        navigate('/auth/login');
      }
    };
    
    checkSession();
  }, [navigate]);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully', {
        description: 'You can now log in with your new password'
      });
      
      // Redirect to login page
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (error: any) {
      toast.error('Failed to update password', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <ShieldCheckIcon className="h-10 w-10 mx-auto text-orange-500 mb-2" />
        <h2 className="text-2xl font-bold">Update Password</h2>
        <p className="text-slate-500 mt-1">
          Create a new secure password for your account
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </div>
  );
};

export default UpdatePasswordPage;
