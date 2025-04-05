
// Export all functionality from the supabase modules
export { getSupabaseClient } from './client';
export { checkTableExists, ensureUuidTableExists } from './tableManagement';
export { storeUserUuid, fetchUserUuid, verifyUuidInSupabase, getAllUuids } from './uuidOperations';
export { ensureGrowTablesExist } from './growTableSetup';
export { syncQueue } from '../supabaseInit';
