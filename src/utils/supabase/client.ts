
// Functions for Supabase storage bucket management

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
  const { supabase } = await import('@/integrations/supabase/client');
  
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
  const { supabase } = await import('@/integrations/supabase/client');
  
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
  const { supabase } = await import('@/integrations/supabase/client');
  
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
