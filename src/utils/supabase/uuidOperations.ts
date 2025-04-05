
// This file is now just a proxy to maintain backward compatibility
// It exports functionality from the new modular structure
import {
  storeUserUuid, 
  fetchUserUuid,
  verifyUuidInSupabase,
  getAllUuids
} from './uuid';

export {
  storeUserUuid,
  fetchUserUuid,
  verifyUuidInSupabase,
  getAllUuids
};
