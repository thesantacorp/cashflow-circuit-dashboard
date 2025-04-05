
// Export all functionality from the supabase modules
export { getSupabaseClient, checkDatabaseConnection } from './client';
export { checkTableExists, ensureUuidTableExists } from './tableManagement';
export { syncQueue, syncDataToSupabase } from '../supabaseInit';
