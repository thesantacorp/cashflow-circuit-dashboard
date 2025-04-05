import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import BackupApprovalDialog from './auth/BackupApprovalDialog';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireBackupApproval?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireBackupApproval = true 
}: ProtectedRouteProps) => {
  const { user, isLoading, isBackupApproved } = useAuth();
  const location = useLocation();
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  useEffect(() => {
    // Show backup approval dialog if user is logged in, backup not approved yet,
    // and we're not already on the backup approval or auth pages
    const nonProtectedPaths = ['/auth', '/auth/login', '/auth/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/update-password'];
    const isNonProtectedPath = nonProtectedPaths.some(path => location.pathname.startsWith(path));
    
    if (user && !isBackupApproved && requireBackupApproval && !isNonProtectedPath) {
      setShowBackupDialog(true);
    } else {
      setShowBackupDialog(false);
    }
  }, [user, isBackupApproved, location.pathname, requireBackupApproval]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If backup approval required but not approved, show backup dialog
  if (showBackupDialog) {
    return <BackupApprovalDialog />;
  }

  // Otherwise, render children
  return <>{children}</>;
};

export default ProtectedRoute;
