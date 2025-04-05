
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const VerificationSuccessPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/auth/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="text-center">
      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-6" />
      <h2 className="text-2xl font-bold mb-4">Email Verified Successfully!</h2>
      <p className="text-slate-600 mb-8">
        Your email address has been confirmed successfully. You can now login to your account.
      </p>
      <Link to="/auth/login">
        <Button className="bg-orange-500 hover:bg-orange-600">
          Go to Login
        </Button>
      </Link>
      <p className="mt-4 text-sm text-slate-500">
        You'll be automatically redirected to the login page in a few seconds...
      </p>
    </div>
  );
};

export default VerificationSuccessPage;
