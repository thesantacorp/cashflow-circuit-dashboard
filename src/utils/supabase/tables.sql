
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
