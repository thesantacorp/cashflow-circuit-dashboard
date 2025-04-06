
import { supabase } from '@/integrations/supabase/client';

// Interface for tracking user sessions
export interface UserSession {
  userId: string;
  sessionId: string;
  lastSeen: string;
  deviceInfo: string;
  isActive: boolean;
}

// Local storage key for active sessions
const ACTIVE_SESSIONS_KEY = 'active_sessions';
const CURRENT_SESSION_KEY = 'current_auth_session_id';

// Get all active sessions from localStorage
export const getActiveSessions = (): UserSession[] => {
  try {
    const sessionsRaw = localStorage.getItem(ACTIVE_SESSIONS_KEY) || '[]';
    return JSON.parse(sessionsRaw);
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
};

// Get the current session
export const getCurrentSession = (): string | null => {
  return localStorage.getItem(CURRENT_SESSION_KEY);
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
    
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error deactivating other sessions:', error);
  }
};

// Track a new session
export const trackSession = (session: UserSession): void => {
  try {
    const sessions = getActiveSessions();
    sessions.push(session);
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem(CURRENT_SESSION_KEY, session.sessionId);
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
    const latestSession = sessions
      .filter(s => s.userId === userId && s.isActive)
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];
    
    return latestSession && latestSession.sessionId === currentSessionId;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return true; // Default to true on error to avoid unnecessary logouts
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
    
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
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
    
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};
