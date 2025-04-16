
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(
      null,
      { headers: corsHeaders }
    );
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Enable row-level security on the transactions and categories tables
    const enableRls = async () => {
      // Enable realtime for transactions table
      const { error: transactionsError } = await supabaseClient.rpc(
        'alter_table_replica_identity',
        { table_name: 'transactions', replica_identity: 'FULL' }
      );

      if (transactionsError) {
        console.error('Error setting replica identity for transactions:', transactionsError);
      }

      // Enable realtime for categories table
      const { error: categoriesError } = await supabaseClient.rpc(
        'alter_table_replica_identity',
        { table_name: 'categories', replica_identity: 'FULL' }
      );

      if (categoriesError) {
        console.error('Error setting replica identity for categories:', categoriesError);
      }

      // Add tables to realtime publication
      const { error: publicationError } = await supabaseClient.rpc(
        'add_tables_to_publication',
        { table_names: ['transactions', 'categories'] }
      );

      if (publicationError) {
        console.error('Error adding tables to publication:', publicationError);
      }
    };

    await enableRls();

    return new Response(
      JSON.stringify({ success: true, message: 'Realtime updates enabled' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
