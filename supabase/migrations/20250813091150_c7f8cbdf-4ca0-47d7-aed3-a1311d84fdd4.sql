-- SECURITY FIX: Phase 1 - Remove dangerous policies and fix user_uuids table security
-- Remove the dangerous "Enable all access" policy that exposes user emails
DROP POLICY IF EXISTS "Enable all access" ON public.user_uuids;

-- SECURITY FIX: Phase 2 - Fix handle_new_user function security vulnerability
-- Update function to prevent privilege escalation attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- SECURITY FIX: Phase 3 - Clean up duplicate RLS policies
-- Remove duplicate policies on profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Remove duplicate/conflicting policies on ideas table  
DROP POLICY IF EXISTS "Enable all access for ideas" ON public.ideas;

-- Remove duplicate/conflicting policies on votes table
DROP POLICY IF EXISTS "Enable all access for votes" ON public.votes;

-- Ensure proper sequence permissions are granted
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_uuids TO authenticated;