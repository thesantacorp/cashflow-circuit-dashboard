import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const completeAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = searchParams.get('code');
      const type = searchParams.get('type') ?? hashParams.get('type');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        if (type === 'recovery') {
          navigate('/auth/update-password', { replace: true });
          return;
        }

        navigate('/auth/verification-success', { replace: true });
      } catch (error: any) {
        toast.error('Authentication link failed', {
          description: error.message,
        });
        navigate('/auth/login', { replace: true });
      }
    };

    void completeAuth();
  }, [navigate]);

  return (
    <div className="py-12 text-center">
      <h2 className="text-2xl font-bold text-foreground">Verifying your account…</h2>
      <p className="mt-2 text-muted-foreground">Please wait while we complete your sign-up.</p>
    </div>
  );
};

export default AuthCallbackPage;