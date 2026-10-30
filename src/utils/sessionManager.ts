
import { supabase } from '@/integrations/supabase/client';
import { secureStorage, sessionUtils } from './secureStorage';

// Interface for tracking user sessions
export interface UserSession {
  userId: string;
  sessionId: string;
  lastSeen: string;
  deviceInfo: string;
  isActive: boolean;
}

// Secure storage keys for active sessions
const ACTIVE_SESSIONS_KEY = 'active_sessions';
const CURRENT_SESSION_KEY = 'current_auth_session_id';
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds

// Get all active sessions from secure storage
export const getActiveSessions = (): UserSession[] => {
  try {
    const sessionsRaw = secureStorage.getItem(ACTIVE_SESSIONS_KEY) || '[]';
    return JSON.parse(sessionsRaw);
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
};

// Get the current session
export const getCurrentSession = (): string | null => {
  return secureStorage.getItem(CURRENT_SESSION_KEY);
};

// Mark all other sessions as inactive
export const deactivateOtherSessions = (userId: string, currentSessionId: string): void => {
  try {
    let sessions = getActiveSessions();
    
    // Mark all sessions for this user as inactive except the current one
    sessions = sessions.map(session => {
      if (session.userId === userId && session.sessionId !== currentSessionId) {
        return { ...session, isActive: false };
      }
      return session;
    });
    
    secureStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error deactivating other sessions:', error);
  }
};

// Strictly enforce single-device login by tracking session and deactivating others
export const trackSession = (session: UserSession): void => {
  try {
    const sessions = getActiveSessions();
    
    // Find and deactivate ANY existing active sessions for this user
    const updatedSessions = sessions.map(s => 
      s.userId === session.userId ? { ...s, isActive: false } : s
    );
    
    // Add the new session
    updatedSessions.push(session);
    
    secureStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    secureStorage.setItem(CURRENT_SESSION_KEY, session.sessionId);
    
    // Set a periodic check to see if this session is still valid
    startSessionValidityCheck(session.userId, session.sessionId);
  } catch (error) {
    console.error('Error tracking session:', error);
  }
};

// Check if current session is valid (not invalidated by other logins)
export const isCurrentSessionValid = async (userId: string): Promise<boolean> => {
  try {
    const currentSessionId = getCurrentSession();
    if (!currentSessionId) return false;
    
    const sessions = getActiveSessions();
    
    // Find latest active session for this user
    const activeSession = sessions
      .filter(s => s.userId === userId && s.isActive)
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];
    
    // No active sessions found
    if (!activeSession) return false;
    
    // If this device's session is not the active one, it's invalid
    return activeSession.sessionId === currentSessionId;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false; // Default to false on error to enforce re-login
  }
};

// Update session last seen time
export const updateSessionLastSeen = (sessionId: string): void => {
  try {
    const sessions = getActiveSessions();
    const updatedSessions = sessions.map(session => {
      if (session.sessionId === sessionId) {
        return { ...session, lastSeen: new Date().toISOString() };
      }
      return session;
    });
    
    secureStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error updating session last seen:', error);
  }
};

// Clear session on logout
export const clearCurrentSession = (): void => {
  try {
    const currentSessionId = getCurrentSession();
    if (!currentSessionId) return;
    
    const sessions = getActiveSessions();
    const updatedSessions = sessions.map(session => {
      if (session.sessionId === currentSessionId) {
        return { ...session, isActive: false };
      }
      return session;
    });
    
    secureStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    secureStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Start periodic checks for session validity
const startSessionValidityCheck = (userId: string, sessionId: string) => {
  const intervalId = setInterval(async () => {
    const isValid = await isCurrentSessionValid(userId);
    if (!isValid) {
      // Session is invalid, log the user out
      clearInterval(intervalId);
      await supabase.auth.signOut();
      console.log('Session invalidated by another login. Signing out automatically.');
    } else {
      // Update last seen time
      updateSessionLastSeen(sessionId);
    }
  }, SESSION_CHECK_INTERVAL);
  
  // Store the interval ID to be able to clear it if needed
  window.sessionCheckIntervalId = intervalId;
  
  // Clear the interval on page unload
  window.addEventListener('beforeunload', () => {
    if (window.sessionCheckIntervalId) {
      clearInterval(window.sessionCheckIntervalId);
    }
  });
};

// Add session check interval ID to Window interface
declare global {
  interface Window {
    sessionCheckIntervalId: ReturnType<typeof setInterval> | undefined;
  }
}
