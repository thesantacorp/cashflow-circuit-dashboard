
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { RecoveryData, RECOVERY_DATA_KEY, EXPIRATION_TIME } from './types';

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
