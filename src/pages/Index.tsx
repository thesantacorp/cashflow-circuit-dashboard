
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { isCurrentSessionValid } from "@/utils/sessionManager";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(true);
  
  // Check if session is valid (not displaced by another login)
  useEffect(() => {
    if (user) {
      const checkSession = async () => {
        try {
          const valid = await isCurrentSessionValid(user.id);
          setIsSessionValid(valid);
          
          if (!valid) {
            console.log('Session invalidated on index page. Signing out.');
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error('Error checking session validity:', error);
        } finally {
          setIsCheckingSession(false);
        }
      };
      
      checkSession();
      
      // Record that we have an active user for stats purposes
      try {
        // We no longer record session data here as it's handled by sessionManager
        console.log('User authenticated on index page, tracking handled by sessionManager');
      } catch (error) {
        console.error("Error recording session:", error);
      }
    } else {
      setIsCheckingSession(false);
      console.log('No user on index page, will redirect to auth');
    }
  }, [user]);
  
  // Show loading while checking session
  if (user && isCheckingSession) {
    return <LoadingScreen />;
  }
  
  // Redirect to the expenses page if authenticated with valid session, otherwise to auth page
  if (user && isSessionValid) {
    return <Navigate to="/expenses" replace />;
  } else {
    return <Navigate to="/auth/login" replace />;
  }
};

export default Index;
