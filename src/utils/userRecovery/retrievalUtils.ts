
import { RecoveryData, RECOVERY_DATA_KEY } from './types';

// Retrieve user data using recovery ID
export const retrieveUserData = (recoveryId: string): RecoveryData | null => {
  try {
    // Get all recovery data from local storage
    const recoveryDataList: RecoveryData[] = JSON.parse(localStorage.getItem(RECOVERY_DATA_KEY) || '[]');
    
    // Find the recovery data with the given ID (either UUID or readable ID)
    const recoveryData = recoveryDataList.find(data => 
      data.id === recoveryId || data.readableId === recoveryId
    );
    
    if (!recoveryData) {
      console.error('Recovery data not found');
      return null;
    }
    
    // Check if the recovery link has expired
    const now = new Date();
    const expiresAt = new Date(recoveryData.expiresAt);
    
    if (now > expiresAt) {
      console.error('Recovery link has expired');
      return null;
    }
    
    // Check if the recovery link has been used
    if (recoveryData.used) {
      console.error('Recovery link has already been used');
      return null;
    }
    
    return recoveryData;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

// Apply recovered user data
export const applyRecoveredUserData = (recoveryData: RecoveryData): boolean => {
  try {
    // Apply the recovered data to local storage
    const { userData } = recoveryData;
    
    // Store each piece of data in local storage
    localStorage.setItem('transactions', JSON.stringify(userData.transactions || []));
    localStorage.setItem('categories', JSON.stringify(userData.categories || []));
    localStorage.setItem('settings', JSON.stringify(userData.settings || {}));
    localStorage.setItem('crowdfunding_ideas', JSON.stringify(userData.ideas || []));
    
    // Mark the recovery data as used
    const recoveryDataList: RecoveryData[] = JSON.parse(localStorage.getItem(RECOVERY_DATA_KEY) || '[]');
    const updatedRecoveryDataList = recoveryDataList.map(data => {
      if (data.id === recoveryData.id) {
        return { ...data, used: true };
      }
      return data;
    });
    
    localStorage.setItem(RECOVERY_DATA_KEY, JSON.stringify(updatedRecoveryDataList));
    
    return true;
  } catch (error) {
    console.error('Error applying recovered user data:', error);
    return false;
  }
};
