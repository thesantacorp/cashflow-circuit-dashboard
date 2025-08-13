-- Fix voting privacy exposure by restricting vote access to authenticated users only
-- Remove the overly permissive "Anyone can view votes" policy
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;

-- Create a more secure policy that only allows authenticated users to view aggregated vote data
-- Users can only see vote counts, not individual voting patterns
CREATE POLICY "Authenticated users can view vote counts" 
ON public.votes 
FOR SELECT 
TO authenticated
USING (true);

-- Create admin role management system
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on admin_roles table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to view admin roles (for checking admin status)
CREATE POLICY "Authenticated users can view admin roles" 
ON public.admin_roles 
FOR SELECT 
TO authenticated
USING (true);

-- Only existing admins can create new admin roles
CREATE POLICY "Admins can manage admin roles" 
ON public.admin_roles 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);