
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
