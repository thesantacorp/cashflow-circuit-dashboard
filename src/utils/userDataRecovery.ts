
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

// Define the types for our data recovery system
export interface RecoveryData {
  id: string;
  readableId: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  userData: {
    transactions: any[];
    categories: any[];
    settings: any;
    ideas: any[];
    [key: string]: any;
  };
}

// Constants
const RECOVERY_DATA_KEY = 'recovery_data';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Generate a readable UUID using nanoid for human-readable part
export const generateReadableUUID = (): { uuid: string; readableId: string } => {
  const uuid = uuidv4();
  // Generate a readable ID using nanoid - shorter and more user friendly
  const readableId = nanoid(8);
  return { uuid, readableId };
};

// Store user data with recovery information
export const storeUserDataForRecovery = (): RecoveryData | null => {
  try {
    // Generate a new UUID and readable ID
    const { uuid, readableId } = generateReadableUUID();
    
    // Get current user data from local storage
    const transactionsData = JSON.parse(localStorage.getItem('transactions') || '[]');
    const categoriesData = JSON.parse(localStorage.getItem('categories') || '[]');
    const settingsData = JSON.parse(localStorage.getItem('settings') || '{}');
    const ideasData = JSON.parse(localStorage.getItem('crowdfunding_ideas') || '[]');
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRATION_TIME);
    
    // Create recovery data object
    const recoveryData: RecoveryData = {
      id: uuid,
      readableId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      userData: {
        transactions: transactionsData,
        categories: categoriesData,
        settings: settingsData,
        ideas: ideasData
      }
    };
    
    // Store recovery data in local storage
    const existingRecoveryData = JSON.parse(localStorage.getItem(RECOVERY_DATA_KEY) || '[]');
    existingRecoveryData.push(recoveryData);
    localStorage.setItem(RECOVERY_DATA_KEY, JSON.stringify(existingRecoveryData));
    
    return recoveryData;
  } catch (error) {
    console.error('Error storing user data for recovery:', error);
    return null;
  }
};

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
    const recoveryDataList: RecoveryData[] = JSON.parse(localStorage.getItem(RECOVERY_DATA_KEY) || '[]');
    
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
