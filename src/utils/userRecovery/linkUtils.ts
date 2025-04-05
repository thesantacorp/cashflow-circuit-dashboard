
import { RECOVERY_DATA_KEY } from './types';
import { storeUserDataForRecovery } from './storageUtils';

// Generate a recovery link
export const generateRecoveryLink = (baseUrl: string = window.location.origin): string | null => {
  const recoveryData = storeUserDataForRecovery();
  if (!recoveryData) return null;
  
  // Create a recovery link using the readable ID for better user experience
  return `${baseUrl}/recover/${recoveryData.readableId}`;
};

// Clean up expired recovery data
export const cleanupExpiredRecoveryData = (): void => {
  try {
    const now = new Date();
    const recoveryDataList = JSON.parse(localStorage.getItem(RECOVERY_DATA_KEY) || '[]');
    
    const validRecoveryDataList = recoveryDataList.filter(data => {
      const expiresAt = new Date(data.expiresAt);
      return expiresAt > now;
    });
    
    localStorage.setItem(RECOVERY_DATA_KEY, JSON.stringify(validRecoveryDataList));
  } catch (error) {
    console.error('Error cleaning up expired recovery data:', error);
  }
};

// Initialize recovery system
export const initRecoverySystem = (): void => {
  // Clean up expired recovery data on initialization
  cleanupExpiredRecoveryData();
};
