
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkDatabaseConnection } from '@/utils/supabase/client';
import { Currency } from '@/types';
import { clearCurrentSession, trackSession } from '@/utils/sessionManager';

// Define the structure of a user profile
interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  backup_last_date: string | null;
  currency_preference: Currency | null;
  created_at: string;
  updated_at: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Store the current session ID to track sessions
const SESSION_KEY = 'current_auth_session_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check connection to Supabase on initial load
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        console.error('Failed to connect to Supabase');
        toast.error('Failed to connect to the database. Please check your internet connection.');
      }
    };
    
    checkConnection();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Check if this is a new login
          if (event === 'SIGNED_IN') {
            // Store the current session ID
            localStorage.setItem(SESSION_KEY, currentSession.access_token);
            console.log('User signed in:', currentSession.user.email);
            
            // Track the session client-side
            try {
              trackSession({
                userId: currentSession.user.id,
                sessionId: currentSession.access_token,
                lastSeen: new Date().toISOString(),
                deviceInfo: navigator.userAgent,
                isActive: true
              });
              
              // Navigate to expenses page after successful login
              // Wrap in setTimeout to avoid potential auth deadlock
              setTimeout(() => {
                navigate('/expenses');
              }, 0);
            } catch (error) {
              console.error('Error tracking session:', error);
            }
          }
          
          // Use setTimeout to avoid potential auth deadlock
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear local session ID
          localStorage.removeItem(SESSION_KEY);
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    const checkExistingSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Got existing session:', currentSession?.user?.email);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing session:', error);
        setIsLoading(false);
      }
    };
    
    checkExistingSession();

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

      setProfile(data as UserProfile);
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
      console.log('Attempting to sign in with:', email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful for:', data.user?.email);
      
      // Deactivate any previous sessions in localStorage
      if (data.user) {
        try {
          // Store the current session
          localStorage.setItem(SESSION_KEY, data.session.access_token);
          
          // Track the new session
          trackSession({
            userId: data.user.id,
            sessionId: data.session.access_token,
            lastSeen: new Date().toISOString(),
            deviceInfo: navigator.userAgent,
            isActive: true
          });
        } catch (sessionError) {
          console.error('Error updating sessions:', sessionError);
        }
      }
      
      toast.success('Signed in successfully');
      // Don't navigate here - let the auth state change listener handle navigation
    } catch (error: any) {
      toast.error('Sign in failed', {
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear session tracking first
      clearCurrentSession();
      
      // Then sign out from Supabase
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await fetchUserProfile(user.id);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Profile update failed', {
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
        updateProfile
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
