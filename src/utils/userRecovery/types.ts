
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
export const RECOVERY_DATA_KEY = 'recovery_data';
export const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
