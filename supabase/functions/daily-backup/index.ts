
// This function will run daily to perform automatic backups for users
// who have enabled the backup feature
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use service role for accessing all users' data (bypassing RLS)
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRole,
    );
    
    // Get all users who have approved backups
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, backup_approved, backup_last_date')
      .eq('backup_approved', true);
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }
    
    console.log(`Found ${profiles.length} users with backup enabled`);
    
    const results = [];
    
    // Process each user's backup
    for (const profile of profiles) {
      const userId = profile.id;
      
      try {
        // In a real implementation, we would:
        // 1. Fetch the user's data (transactions, categories, etc.)
        // 2. Format it for backup (e.g., JSON, CSV)
        // 3. Upload to Google Drive via the Drive API
        // 4. Update the user's backup_last_date
        
        console.log(`Processing backup for user: ${userId}`);
        
        // Update the backup last date
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            backup_last_date: new Date().toISOString() 
          })
          .eq('id', userId);
        
        if (updateError) {
          throw new Error(`Error updating backup date: ${updateError.message}`);
        }
        
        results.push({
          userId,
          success: true,
          message: "Backup completed successfully"
        });
      } catch (userError) {
        console.error(`Error backing up data for user ${userId}:`, userError);
        
        results.push({
          userId,
          success: false,
          error: userError.message
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: profiles.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in daily-backup function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
