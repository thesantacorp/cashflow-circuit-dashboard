
import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import AppLogo from '@/components/AppLogo';

const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If still loading, show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is already authenticated and tries to access /auth directly,
  // redirect to the root page
  if (user && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  // If user is already authenticated and not on a specific auth page,
  // redirect to the root page
  if (user && location.pathname === '/auth/login') {
    return <Navigate to="/" replace />;
  }

  // For sign-up, email verification, and password reset, allow access regardless of auth status
  // The specific page components will handle their own conditional logic

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AppLogo className="h-12 w-12 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-slate-800">Stack'd</h1>
            <p className="text-slate-500">Track your finances with ease</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Outlet />
          </div>
          
          <div className="text-center mt-6 text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Stack'd. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
