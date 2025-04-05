
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to the overview page
  return <Navigate to="/" replace />;
};

export default Index;
