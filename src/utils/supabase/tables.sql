
-- This file contains the SQL needed for the new features
-- You'll need to run these in the Supabase SQL Editor

-- Table for tracking user sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update their own sessions
CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table for storing automatic backups
CREATE TABLE IF NOT EXISTS public.user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  transactions_data JSONB,
  categories_data JSONB,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on backups table
ALTER TABLE public.user_backups ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own backups
CREATE POLICY "Users can view their own backups" ON public.user_backups
  FOR SELECT USING (auth.uid() = user_id);

-- Add a backup_approved column to the profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_approved BOOLEAN DEFAULT false;

-- Create a cron job to run the daily backup function at 9pm every day
-- Make sure the pg_cron extension is enabled in your Supabase project
SELECT cron.schedule(
  'daily-backup-9pm',
  '0 21 * * *',  -- Run at 9pm every day
  $$
  SELECT net.http_post(
    url := 'https://tsidnalhlgcmcnqawgux.supabase.co/functions/v1/daily-backup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWRuYWxobGdjbWNucWF3Z3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjkzNTIsImV4cCI6MjA1OTQwNTM1Mn0.G9voKlG0s22kFnNX2qE8Tfv5xq8amdion7J6Xfi8rKQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Create RLS policies for the ideas table if they don't exist
DO $$
BEGIN
  -- Enable RLS for the ideas table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ideas') THEN
    ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Public can view ideas" ON public.ideas;
    DROP POLICY IF EXISTS "Authenticated users can create ideas" ON public.ideas;
    DROP POLICY IF EXISTS "Users can update their own ideas" ON public.ideas;
    DROP POLICY IF EXISTS "Admins can delete ideas" ON public.ideas;
    
    -- Create new policies
    CREATE POLICY "Public can view ideas" 
      ON public.ideas FOR SELECT 
      USING (true);
      
    CREATE POLICY "Authenticated users can create ideas" 
      ON public.ideas FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Users can update their own ideas" 
      ON public.ideas FOR UPDATE 
      USING (auth.uid() = created_by);
      
    CREATE POLICY "Admins can delete ideas" 
      ON public.ideas FOR DELETE 
      USING (
        (SELECT session_data->>'adminAuthenticated' FROM auth.sessions WHERE user_id = auth.uid()) = 'true'
        OR
        auth.uid() = created_by
      );
  END IF;
END
$$;

-- Create function to create the ideas bucket
CREATE OR REPLACE FUNCTION public.create_ideas_bucket_if_not_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Insert into storage.buckets if not exists
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('ideas', 'ideas', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Set up default policies for the bucket
  -- These will be no-ops if the policies already exist
  BEGIN
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES 
      ('Public Read Access', '{"name":"Public Read Access for ideas","owner":"authenticated","deployment_id":"1","bucket_id":"ideas","allow_access":"true","permission":"select","definition":{"name":"Public Read Access for ideas","allow_access":true,"permission":"select","definition":{"id":"ideas"}}}', 'ideas'),
      ('Authenticated Insert', '{"name":"Authenticated Insert for ideas","owner":"authenticated","deployment_id":"1","bucket_id":"ideas","allow_access":"(auth.uid() IS NOT NULL)","permission":"insert","definition":{"name":"Authenticated Insert for ideas","allow_access":"(auth.uid() IS NOT NULL)","permission":"insert","definition":{"id":"ideas"}}}', 'ideas')
    ON CONFLICT DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error setting up bucket policies: %', SQLERRM;
  END;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating bucket: %', SQLERRM;
    RETURN false;
END;
$$;
