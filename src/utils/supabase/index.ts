
// Export all functionality from the supabase modules
export { getSupabaseClient, checkDatabaseConnection } from './client';
export { checkTableExists, ensureUuidTableExists } from './tableManagement';
export { storeUserUuid, fetchUserUuid, verifyUuidInSupabase, getAllUuids } from './uuidOperations';
export { ensureGrowTablesExist } from './grow';
export { createProjectsTable, createProjectVotesTable, createAllGrowTables } from './grow/tableOperations';
export { syncQueue } from '../supabaseInit';
