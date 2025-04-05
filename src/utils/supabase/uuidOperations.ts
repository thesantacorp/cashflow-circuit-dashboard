
// This file is now just a proxy to maintain backward compatibility
// It exports functionality from the new modular structure
import {
  storeUserUuid, 
  fetchUserUuid,
  verifyUuidInSupabase,
  getAllUuids,
  uuidOperations
} from './uuid';

export {
  storeUserUuid,
  fetchUserUuid,
  verifyUuidInSupabase,
  getAllUuids,
  // Also export the new operations interface
  uuidOperations
};

// For backward compatibility
export const uuid = uuidOperations;
