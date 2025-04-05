
// Export all functionality from the supabase modules
export { getSupabaseClient, checkDatabaseConnection } from './client';
export { checkTableExists, ensureUuidTableExists } from './tableManagement';
export { storeUserUuid, fetchUserUuid, verifyUuidInSupabase, getAllUuids } from './uuidOperations';
export { syncQueue, syncDataToSupabase } from '../supabaseInit';
