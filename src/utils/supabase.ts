
import { createClient } from '@supabase/supabase-js';

// Use environment variables or direct URL/key if they're public keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table name for user UUIDs
export const UUID_TABLE = 'user_uuids';

// Functions for UUID management in Supabase
export async function fetchUserUuid(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(UUID_TABLE)
    .select('uuid')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.error('Error fetching UUID:', error);
    return null;
  }

  return data.uuid;
}

export async function storeUserUuid(email: string, uuid: string): Promise<boolean> {
  // Check if entry already exists
  const { data: existingData } = await supabase
    .from(UUID_TABLE)
    .select('id')
    .eq('email', email)
    .single();

  if (existingData) {
    // Update existing entry
    const { error: updateError } = await supabase
      .from(UUID_TABLE)
      .update({ uuid })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating UUID:', updateError);
      return false;
    }
  } else {
    // Create new entry
    const { error: insertError } = await supabase
      .from(UUID_TABLE)
      .insert([{ email, uuid }]);

    if (insertError) {
      console.error('Error storing UUID:', insertError);
      return false;
    }
  }

  return true;
}
