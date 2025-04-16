
import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import AppLogo from '@/components/AppLogo';

const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('AuthPage - Auth state:', {
      user: user?.email,
      isLoading,
      pathname: location.pathname
    });
  }, [user, isLoading, location.pathname]);

  // If still loading, show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is already authenticated and tries to access /auth directly,
  // redirect to the expenses page
  if (user && location.pathname === '/auth') {
    console.log('User already authenticated, redirecting to expenses');
    return <Navigate to="/expenses" replace />;
  }

  // If user is already authenticated and on login page,
  // redirect to the expenses page
  if (user && location.pathname === '/auth/login') {
    console.log('User already authenticated and on login page, redirecting to expenses');
    return <Navigate to="/expenses" replace />;
  }

  // For sign-up, email verification, and password reset, allow access regardless of auth status
  // The specific page components will handle their own conditional logic

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <AppLogo className="h-12 w-12 mx-auto mb-1" />
            <h1 className="text-2xl font-bold text-slate-800">Stack'd</h1>
            <p className="text-slate-500">Don't just track, grow your finances.</p>
          </div>
          
          <Outlet />
        </div>
      </div>
      <div className="text-xs text-center text-slate-500 pb-4">
        © 2025 Stack'd by Fushure. All rights reserved.
      </div>
    </div>
  );
};

export default AuthPage;
