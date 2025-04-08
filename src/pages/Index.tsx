
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  // Redirect to the expenses page if authenticated, otherwise to auth page
  return <Navigate to={user ? "/expenses" : "/auth"} replace />;
};

export default Index;
