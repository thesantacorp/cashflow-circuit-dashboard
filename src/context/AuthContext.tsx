
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<any>) => Promise<void>;
  updateBackupApproval: (approved: boolean) => Promise<void>;
  isBackupApproved: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupApproved, setIsBackupApproved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user profile with a delay to prevent deadlocks
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsBackupApproved(false);
        }
        
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data);
      setIsBackupApproved(!!data?.backup_approved);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) throw error;
      toast.success('Verification email sent', {
        description: 'Please check your inbox'
      });
      navigate('/auth/verify-email', { state: { email } });
    } catch (error: any) {
      toast.error('Sign up failed', {
        description: error.message
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error('Sign in failed', {
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Sign out failed', {
        description: error.message
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent', {
        description: 'Please check your inbox'
      });
      navigate('/auth/verify-email', { state: { email, isReset: true } });
    } catch (error: any) {
      toast.error('Password reset failed', {
        description: error.message
      });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<any>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile data
      await fetchUserProfile(user.id);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Profile update failed', {
        description: error.message
      });
      throw error;
    }
  };

  const updateBackupApproval = async (approved: boolean) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      await updateProfile({ 
        backup_approved: approved,
        backup_last_date: approved ? new Date().toISOString() : null
      });
      
      setIsBackupApproved(approved);
      toast.success(approved ? 'Backup approved' : 'Backup disabled');
    } catch (error: any) {
      toast.error('Backup approval update failed', {
        description: error.message
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        updateBackupApproval,
        isBackupApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
