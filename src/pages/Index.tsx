
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // This helps ensure user data is properly tracked for admin stats
    if (user) {
      console.log('User authenticated on index page, tracking session');
      // Record that we have an active user for stats purposes
      try {
        const activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
        const currentSession = {
          userId: user.id,
          sessionId: Math.random().toString(36).substring(2),
          lastSeen: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          isActive: true
        };
        
        activeSessions.push(currentSession);
        localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
      } catch (error) {
        console.error("Error recording session:", error);
      }
    } else {
      console.log('No user on index page, will redirect to auth');
    }
  }, [user]);
  
  // Redirect to the expenses page if authenticated, otherwise to auth page
  return user ? <Navigate to="/expenses" replace /> : <Navigate to="/auth/login" replace />;
};

export default Index;
