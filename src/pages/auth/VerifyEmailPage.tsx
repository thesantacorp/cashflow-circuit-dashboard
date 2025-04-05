
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MailIcon, RefreshCwIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const isReset = location.state?.isReset || false;

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect to login
      navigate('/auth/login');
    }
  }, [location.state, navigate]);

  const handleResendEmail = async () => {
    if (isResending || countdown > 0) return;
    
    setIsResending(true);
    
    try {
      // For password reset or sign up confirmation
      const { error } = isReset 
        ? await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
          })
        : await supabase.auth.resend({
            type: 'signup',
            email,
          });
      
      if (error) throw error;
      
      toast.success(isReset ? 'Password reset email sent' : 'Verification email sent');
      
      // Start countdown for 60 seconds
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      toast.error('Failed to resend email', {
        description: error.message
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center">
      <MailIcon className="h-12 w-12 mx-auto text-orange-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Check your email</h2>
      <p className="text-slate-600 mb-6">
        We've sent a {isReset ? 'password reset' : 'verification'} link to <strong>{email}</strong>.
        Please check your inbox and follow the instructions.
      </p>
      
      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleResendEmail} 
          disabled={isResending || countdown > 0}
        >
          {isResending ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            'Resend Email'
          )}
        </Button>
        
        <Link to="/auth/login">
          <Button variant="link" className="w-full text-orange-600">
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
