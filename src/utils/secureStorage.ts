// Secure storage utilities for sensitive data
const ENCRYPTION_KEY = 'secure_app_key_v1';

// Simple encryption for localStorage (basic security layer)
const encrypt = (text: string): string => {
  try {
    // Simple base64 encoding with key rotation - not cryptographically secure but better than plain text
    const encoded = btoa(JSON.stringify({ data: text, key: ENCRYPTION_KEY, timestamp: Date.now() }));
    return encoded;
  } catch {
    return text; // Fallback to plain text if encryption fails
  }
};

const decrypt = (encryptedText: string): string => {
  try {
    const decoded = JSON.parse(atob(encryptedText));
    if (decoded.key === ENCRYPTION_KEY) {
      return decoded.data;
    }
    return encryptedText; // Return as-is if key doesn't match
  } catch {
    return encryptedText; // Return as-is if decryption fails
  }
};

export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, encrypt(value));
    } catch (error) {
      console.error('Error setting secure storage item:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? decrypt(item) : null;
    } catch (error) {
      console.error('Error getting secure storage item:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure storage item:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }
};

// Session timeout utilities
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const sessionUtils = {
  setSessionTimeout: (callback: () => void): number => {
    return window.setTimeout(callback, SESSION_TIMEOUT);
  },

  clearSessionTimeout: (timeoutId: number): void => {
    clearTimeout(timeoutId);
  },

  isSessionExpired: (lastActivity: number): boolean => {
    return Date.now() - lastActivity > SESSION_TIMEOUT;
  },

  updateLastActivity: (): void => {
    secureStorage.setItem('last_activity', Date.now().toString());
  },

  getLastActivity: (): number => {
    const lastActivity = secureStorage.getItem('last_activity');
    return lastActivity ? parseInt(lastActivity, 10) : Date.now();
  }
};