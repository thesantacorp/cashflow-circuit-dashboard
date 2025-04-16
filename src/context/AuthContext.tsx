
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkDatabaseConnection } from '@/utils/supabase/client';

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
            
            // Track the session client-side instead of database
            try {
              const sessionData = {
                userId: currentSession.user.id,
                sessionId: currentSession.access_token,
                lastSeen: new Date().toISOString(),
                deviceInfo: navigator.userAgent,
                isActive: true
              };
              
              // Store in localStorage for tracking
              const activeSessionsRaw = localStorage.getItem('active_sessions') || '[]';
              let activeSessions = JSON.parse(activeSessionsRaw);
              
              // Add the new session
              activeSessions.push(sessionData);
              localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
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
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('Got existing session:', currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Check if this session has been invalidated by another login
        const storedSessionId = localStorage.getItem(SESSION_KEY);
        const activeSessionsRaw = localStorage.getItem('active_sessions') || '[]';
        const activeSessions = JSON.parse(activeSessionsRaw);
        
        // Find the most recent active session
        const latestSession = activeSessions
          .filter((s: any) => s.userId === currentSession.user.id && s.isActive)
          .sort((a: any, b: any) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];
        
        // If there's an active session and it's not this one, sign out
        if (latestSession && storedSessionId && latestSession.sessionId !== storedSessionId) {
          console.log('Session invalidated by another login. Signing out.');
          await supabase.auth.signOut();
          toast.info('You have been signed out because you signed in on another device');
          setSession(null);
          setUser(null);
        } else {
          // This is the current active session, fetch profile
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        }
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
          // Get active sessions
          const activeSessionsRaw = localStorage.getItem('active_sessions') || '[]';
          let activeSessions = JSON.parse(activeSessionsRaw);
          
          // Mark all previous sessions for this user as inactive
          activeSessions = activeSessions.map((session: any) => {
            if (session.userId === data.user.id) {
              return { ...session, isActive: false };
            }
            return session;
          });
          
          // Add the new session
          activeSessions.push({
            userId: data.user.id,
            sessionId: data.session.access_token,
            lastSeen: new Date().toISOString(),
            deviceInfo: navigator.userAgent,
            isActive: true
          });
          
          // Store updated sessions
          localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
          localStorage.setItem(SESSION_KEY, data.session.access_token);
        } catch (sessionError) {
          console.error('Error updating sessions:', sessionError);
        }
      }
      
      toast.success('Signed in successfully');
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
      
      // Update local session tracking
      if (user) {
        const activeSessionsRaw = localStorage.getItem('active_sessions') || '[]';
        let activeSessions = JSON.parse(activeSessionsRaw);
        
        // Mark this session as inactive
        const sessionId = localStorage.getItem(SESSION_KEY);
        if (sessionId) {
          activeSessions = activeSessions.map((session: any) => {
            if (session.sessionId === sessionId) {
              return { ...session, isActive: false };
            }
            return session;
          });
          
          localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
          localStorage.removeItem(SESSION_KEY);
        }
      }
      
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
