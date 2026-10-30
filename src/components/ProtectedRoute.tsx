
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from './LoadingScreen';
import { isCurrentSessionValid } from '@/utils/sessionManager';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(true);

  // Check session validity
  useEffect(() => {
    if (user && !isLoading) {
      const checkSession = async () => {
        try {
          const valid = await isCurrentSessionValid(user.id);
          setIsSessionValid(valid);
          
          if (!valid) {
            console.log('Session invalidated on protected route. Signing out.');
            await supabase.auth.signOut();
            navigate('/auth/login', { replace: true });
          }
        } catch (error) {
          console.error('Error checking session validity:', error);
        } finally {
          setIsCheckingSession(false);
        }
      };
      
      checkSession();
    } else {
      setIsCheckingSession(false);
    }
  }, [user, isLoading, navigate]);

  // Show loading screen while checking authentication or session validity
  if (isLoading || (user && isCheckingSession)) {
    return <LoadingScreen />;
  }

  // If not authenticated or session is invalid, redirect to login
  if (!user || !isSessionValid) {
    console.log('User not authenticated or session invalid, redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authenticated with valid session, render children
  return <>{children}</>;
};

export default ProtectedRoute;
