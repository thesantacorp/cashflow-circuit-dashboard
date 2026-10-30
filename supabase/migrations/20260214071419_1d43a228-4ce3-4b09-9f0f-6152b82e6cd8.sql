
-- Create user_backups table for the daily-backup edge function
CREATE TABLE public.user_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transactions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_backups ENABLE ROW LEVEL SECURITY;

-- Users can view their own backups
CREATE POLICY "Users can view their own backups"
ON public.user_backups
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert backups (edge function uses service role)
CREATE POLICY "Service role can insert backups"
ON public.user_backups
FOR INSERT
WITH CHECK (true);

-- Users can delete their own old backups
CREATE POLICY "Users can delete their own backups"
ON public.user_backups
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_backups_user_id ON public.user_backups(user_id);
CREATE INDEX idx_user_backups_backup_date ON public.user_backups(backup_date DESC);

-- Add backup_approved column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_approved BOOLEAN DEFAULT true;
