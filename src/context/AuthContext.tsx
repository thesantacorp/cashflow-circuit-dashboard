
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Store the current session ID to track sessions across devices
const SESSION_KEY = 'current_auth_session_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Check if this is a new login
          if (event === 'SIGNED_IN') {
            // Store the current session ID
            localStorage.setItem(SESSION_KEY, currentSession.access_token);
            
            // Register this device for the user
            try {
              await supabase.from('user_sessions')
                .upsert({
                  user_id: currentSession.user.id,
                  session_id: currentSession.access_token,
                  last_seen: new Date().toISOString(),
                  device_info: navigator.userAgent
                }, { onConflict: 'session_id' });
            } catch (error) {
              console.error('Error registering session:', error);
            }
          }
          
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
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Check if this session is still valid or has been invalidated by another login
        try {
          const { data, error } = await supabase.from('user_sessions')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .eq('is_active', true)
            .order('last_seen', { ascending: false })
            .limit(1);
            
          if (error) throw error;
          
          // If there's an active session and it's not this one, sign out
          const storedSessionId = localStorage.getItem(SESSION_KEY);
          if (data && data.length > 0 && data[0].session_id !== storedSessionId) {
            console.log('Session invalidated by another login. Signing out.');
            await supabase.auth.signOut();
            toast.info('You have been signed out because you signed in on another device');
            setSession(null);
            setUser(null);
          } else {
            // This is the current active session, update last seen
            fetchUserProfile(currentSession.user.id);
            
            if (storedSessionId) {
              await supabase.from('user_sessions').upsert({
                user_id: currentSession.user.id,
                session_id: storedSessionId,
                last_seen: new Date().toISOString(),
                is_active: true
              }, { onConflict: 'session_id' });
            }
          }
        } catch (error) {
          console.error('Error checking session validity:', error);
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
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Deactivate any previous sessions for this user
      if (data.user) {
        try {
          // First make all sessions inactive
          await supabase.from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', data.user.id);
            
          // Then make current session active
          await supabase.from('user_sessions').upsert({
            user_id: data.user.id,
            session_id: data.session.access_token,
            last_seen: new Date().toISOString(),
            is_active: true,
            device_info: navigator.userAgent
          }, { onConflict: 'session_id' });
          
          localStorage.setItem(SESSION_KEY, data.session.access_token);
        } catch (sessionError) {
          console.error('Error updating sessions:', sessionError);
        }
      }
      
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
