
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
    
    const now = new Date();
    console.log(`Daily backup triggered at ${now.toISOString()}`);
    
    // Get all users who have approved backups
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, backup_approved, backup_last_date')
      .eq('backup_approved', true);
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }
    
    // Filter users who haven't had a backup in the last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const profilesNeedingBackup = profiles.filter(p => 
      !p.backup_last_date || p.backup_last_date < twentyFourHoursAgo
    );
    
    console.log(`Found ${profilesNeedingBackup.length} users needing backup out of ${profiles.length} with backup enabled`);
    
    const results = [];
    
    // Process each user's backup
    for (const profile of profilesNeedingBackup) {
      const userId = profile.id;
      
      try {
        // Get all transactions for this user
        const { data: transactions, error: txError } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('user_email', profile.email);
          
        if (txError) throw txError;
        
        // Get all categories for this user
        const { data: categories, error: catError } = await supabaseAdmin
          .from('categories')
          .select('*')
          .eq('user_email', profile.email);
          
        if (catError) throw catError;
        
        // Store backup data
        const { error: backupError } = await supabaseAdmin
          .from('user_backups')
          .insert({
            user_id: userId,
            transactions_data: transactions || [],
            categories_data: categories || [],
            backup_date: now.toISOString()
          });
          
        if (backupError) throw backupError;
        
        // Update the backup last date
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            backup_last_date: now.toISOString() 
          })
          .eq('id', userId);
        
        if (updateError) {
          throw new Error(`Error updating backup date: ${updateError.message}`);
        }
        
        results.push({
          userId,
          email: profile.email,
          success: true,
          message: "Backup completed successfully"
        });
      } catch (userError) {
        console.error(`Error backing up data for user ${userId}:`, userError);
        
        results.push({
          userId,
          email: profile.email,
          success: false,
          error: userError.message
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: profilesNeedingBackup.length,
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
