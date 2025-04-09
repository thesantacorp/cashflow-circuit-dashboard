
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const NotFound = () => {
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const [isLoadError, setIsLoadError] = useState(false);

  useEffect(() => {
    // Check if this is likely a network error rather than a true 404
    // We can tell by checking if we're offline and this isn't a known route
    if (!isOnline && !location.pathname.startsWith('/auth')) {
      setIsLoadError(true);
    } else {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname, isOnline]);

  if (isLoadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-amber-600">You're Offline</h1>
          <p className="text-lg text-gray-600 mb-6">
            The page you're trying to access isn't available offline.
          </p>
          <p className="mb-6 text-gray-500">
            Try one of these pages that work offline:
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/expenses" className="text-blue-500 hover:text-blue-700 underline text-lg py-2">
              Expenses
            </Link>
            <Link to="/income" className="text-blue-500 hover:text-blue-700 underline text-lg py-2">
              Income
            </Link>
            <Link to="/overview" className="text-blue-500 hover:text-blue-700 underline text-lg py-2">
              Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
