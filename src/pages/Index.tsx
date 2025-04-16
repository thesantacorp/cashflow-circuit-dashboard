
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // This helps ensure user data is properly tracked for admin stats
    if (user) {
      console.log('User authenticated on index page, redirecting to expenses');
    } else {
      console.log('No user on index page, will redirect to auth');
    }
  }, [user]);
  
  // Redirect to the expenses page if authenticated, otherwise to auth page
  return user ? <Navigate to="/expenses" replace /> : <Navigate to="/auth/login" replace />;
};

export default Index;
