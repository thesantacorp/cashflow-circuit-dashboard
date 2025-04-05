
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRoundIcon, LoaderIcon, ArrowLeftIcon } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      // Navigation is handled in resetPassword function
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <KeyRoundIcon className="h-10 w-10 mx-auto text-orange-500 mb-2" />
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-slate-500 mt-1">
          We'll send you a link to reset your password
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            autoComplete="email"
          />
        </div>
        
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <Link to="/auth/login" className="inline-flex items-center text-orange-600 hover:text-orange-800">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
