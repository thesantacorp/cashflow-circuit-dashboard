
// This file contains functions for Supabase storage bucket management and client utilities

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type for allowed table names based on the Database type
type KnownTableNames = keyof Database['public']['Tables'];

// Add a type that ensures the table is a known table in our Database type
export type TableName = KnownTableNames;

/**
 * Ensures a storage bucket exists and is properly configured
 * @param bucketName Name of the bucket to ensure
 * @param makePublic Whether to make the bucket public
 * @returns Promise<boolean> indicating success
 */
export const ensureStorageBucketExists = async (
  bucketName: string,
  makePublic = true
): Promise<boolean> => {
  try {
    // First check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating...`);
      
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: makePublic,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        throw createError;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
    } else if (makePublic) {
      // If the bucket exists but we want to ensure it's public
      try {
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });
        
        if (updateError) {
          console.error(`Error updating bucket ${bucketName}:`, updateError);
          // Don't throw, as the bucket exists and might still work
        }
      } catch (updateErr) {
        console.warn(`Could not update bucket ${bucketName}:`, updateErr);
        // Don't throw, as the bucket exists and might still work
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

/**
 * Makes a file in a bucket publicly accessible
 * @param bucketName Name of the bucket
 * @param filePath Path to the file in the bucket
 * @returns Promise<boolean> indicating success
 */
export const makeFilePublic = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  try {
    // First try to make the bucket public (if it's not already)
    await ensureStorageBucketExists(bucketName, true);
    
    // Then try to update the file's public status
    const { error } = await supabase.storage.from(bucketName).update(filePath, undefined, {
      cacheControl: '3600',
      upsert: true
    });
    
    if (error) {
      console.error(`Error making file ${filePath} public:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error making file ${filePath} public:`, error);
    return false;
  }
};

// Try to verify public permissions on a file
export const verifyFileIsPublic = async (
  bucketName: string, 
  filePath: string
): Promise<boolean> => {
  try {
    // Get the public URL first
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    
    if (!publicUrl) {
      return false;
    }
    
    // Attempt to fetch the URL to ensure it's public
    const response = await fetch(publicUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error verifying file ${filePath} is public:`, error);
    return false;
  }
};

/**
 * Get the Supabase client instance - utility function used across the app
 * @returns Supabase client instance
 */
export const getSupabaseClient = () => {
  return supabase;
};

/**
 * Type-safe from operation to improve type checking with Supabase
 * Use for table operations to get proper typing
 * @param table A known table name from the Database type
 */
export const typeSafeFrom = <T extends KnownTableNames>(table: T) => {
  return supabase.from(table);
};

/**
 * Alternative from operation that accepts string table names
 * Use only when the table name is dynamic and can't be type checked
 * @param tableName Dynamic table name as string
 */
export const dynamicFrom = (tableName: string) => {
  // Use explicit any type to properly bypass TypeScript's strict type checking
  // This allows us to use dynamic table names at runtime while preserving the API
  return supabase.from(tableName as any);
};

/**
 * Checks if the database connection is working
 * @returns Promise<boolean> indicating if the connection is successful
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Attempt a simple query to verify connection - use known table name to be type-safe
    const { data, error } = await supabase
      .from('user_uuids')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection check exception:', error);
    return false;
  }
};

/**
 * Helper to check if an error is related to Row Level Security policies
 * @param error The error to check
 * @returns boolean indicating if it's an RLS policy error
 */
export const isRlsPolicyError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for common RLS error patterns
  const errorMessage = error.message || '';
  return (
    errorMessage.includes('policy') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('new row violates row-level security') ||
    error.code === 'PGRST301'
  );
};
