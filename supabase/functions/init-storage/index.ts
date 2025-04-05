
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdminClient = createClient(
      // Use Deno.env to get environment variables
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Check if buckets need to be created
    const { data: existingBuckets, error: bucketError } = await supabaseAdminClient
      .storage
      .listBuckets();

    if (bucketError) {
      throw bucketError;
    }

    console.log('Existing buckets:', existingBuckets);
    
    // Define buckets that should exist
    const requiredBuckets = [
      {
        id: 'avatars',
        name: 'avatars',
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      },
      {
        id: 'ideas',
        name: 'ideas',
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      }
    ];

    // Create any missing buckets
    const existingBucketIds = existingBuckets?.map(bucket => bucket.id) || [];
    const bucketCreationPromises = [];

    for (const bucket of requiredBuckets) {
      if (!existingBucketIds.includes(bucket.id)) {
        console.log(`Creating bucket: ${bucket.id}`);
        bucketCreationPromises.push(
          supabaseAdminClient.storage.createBucket(bucket.id, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
          })
        );
      } else {
        console.log(`Bucket ${bucket.id} already exists.`);
      }
    }

    await Promise.all(bucketCreationPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Storage initialization completed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error initializing storage:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to initialize storage',
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }, 
        status: 500 
      }
    );
  }
});
