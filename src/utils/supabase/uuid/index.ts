
// Export types
export * from './types';

// Export core functions
import { storeUserUuid, storeUserUuidWithDetails } from './storeUuid';
import { fetchUserUuid, fetchUserUuidWithDetails } from './fetchUuid';
import { verifyUuidInSupabase, verifyUuidWithDetails } from './verifyUuid';
import { getAllUuids, getUuidCount, searchUuidsByEmail } from './queries';

// Re-export core functionality
export {
  // Storage functions
  storeUserUuid,
  storeUserUuidWithDetails,
  
  // Fetch functions
  fetchUserUuid,
  fetchUserUuidWithDetails,
  
  // Verification functions
  verifyUuidInSupabase,
  verifyUuidWithDetails,
  
  // Query functions
  getAllUuids,
  getUuidCount,
  searchUuidsByEmail
};

// Enhanced UUID operations interface
export const uuidOperations = {
  store: {
    basic: storeUserUuid,
    withDetails: storeUserUuidWithDetails
  },
  fetch: {
    basic: fetchUserUuid,
    withDetails: fetchUserUuidWithDetails
  },
  verify: {
    basic: verifyUuidInSupabase,
    withDetails: verifyUuidWithDetails
  },
  query: {
    getAll: getAllUuids,
    count: getUuidCount,
    search: searchUuidsByEmail
  }
};
