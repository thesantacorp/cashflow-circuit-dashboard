
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to the expenses page
  return <Navigate to="/expenses" replace />;
};

export default Index;
