
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightIcon, LoaderIcon } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
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
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth/forgot-password" className="text-sm text-orange-600 hover:text-orange-800">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Don't just track, stack up your finance.
        </p>
        <p className="text-sm text-slate-600 mt-4">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-orange-600 hover:text-orange-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-4 border-t text-center text-xs text-slate-500">
        © 2025 Stack'd by Fushure. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
