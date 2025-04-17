
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkDatabaseConnection } from '@/utils/supabase/client';
import { 
  trackSession, 
  isCurrentSessionValid, 
  deactivateOtherSessions, 
  clearCurrentSession,
  getCurrentSession
} from '@/utils/sessionManager';
import { useIsMobile } from '@/hooks/use-mobile';

// Define the structure of a user profile
interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  backup_last_date: string | null;
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
  const isMobile = useIsMobile();

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Check if this is a new login
          if (event === 'SIGNED_IN') {
            // Store the current session ID
            localStorage.setItem(SESSION_KEY, currentSession.access_token);
            console.log('User signed in:', currentSession.user.email);
            
            // Track the session client-side for single device enforcement
            try {
              const sessionData = {
                userId: currentSession.user.id,
                sessionId: currentSession.access_token,
                lastSeen: new Date().toISOString(),
                deviceInfo: navigator.userAgent,
                isActive: true
              };
              
              // Track session (this will deactivate other sessions)
              trackSession(sessionData);
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
          clearCurrentSession();
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('Got existing session:', currentSession?.user?.email);
      
      if (currentSession?.user) {
        // Check if this session has been invalidated by another login
        const isValid = await isCurrentSessionValid(currentSession.user.id);
        
        if (!isValid) {
          console.log('Session invalidated by another login. Signing out.');
          await supabase.auth.signOut();
          if (!isMobile) {
            toast.info('You have been signed out because you signed in on another device');
          }
          setSession(null);
          setUser(null);
        } else {
          // This is the current active session, set the state
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch profile after a small delay to avoid potential auth deadlock
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        }
      } else {
        // No session, just update the state
        setSession(null);
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isMobile]);

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
      
      // Create new session data for tracking
      if (data.user) {
        const sessionData = {
          userId: data.user.id,
          sessionId: data.session.access_token,
          lastSeen: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          isActive: true
        };
        
        // This will deactivate any other sessions
        trackSession(sessionData);
        localStorage.setItem(SESSION_KEY, data.session.access_token);
      }
      
      if (!isMobile) {
        toast.success('Signed in successfully');
      }
      navigate('/expenses');
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
      
      // Clear the current session
      clearCurrentSession();
      
      if (!isMobile) {
        toast.success('Signed out successfully');
      }
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
      if (!isMobile) {
        toast.success('Profile updated successfully');
      }
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
