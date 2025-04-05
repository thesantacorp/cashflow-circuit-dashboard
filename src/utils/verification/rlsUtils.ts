
// Export a function to generate SQL that will fix RLS issues
export function getRlsFixSql(): string {
  return `
-- Update RLS policies on user_uuids table
ALTER TABLE IF EXISTS public.user_uuids ENABLE ROW LEVEL SECURITY;

-- Delete existing policies (if any)
DROP POLICY IF EXISTS "Enable all access" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow anonymous selects" ON public.user_uuids;

-- Create a policy to allow all operations for both anon and authenticated users
CREATE POLICY "Enable all access" 
ON public.user_uuids 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Grant full permissions
GRANT ALL ON public.user_uuids TO anon, authenticated;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon, authenticated;
  `.trim();
}
