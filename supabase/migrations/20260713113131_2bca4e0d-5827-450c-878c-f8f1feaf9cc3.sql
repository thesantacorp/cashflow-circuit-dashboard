
-- 1) Create app_role enum + has_role helper if not present (avoid recursive admin policy)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Lock down execute on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) admin_roles: remove overly-broad SELECT + recursive ALL policy
DROP POLICY IF EXISTS "Authenticated users can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage admin roles" ON public.admin_roles;

CREATE POLICY "Admins can view admin roles"
  ON public.admin_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin roles"
  ON public.admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update admin roles"
  ON public.admin_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin roles"
  ON public.admin_roles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3) user_backups: restrict INSERT to owner
DROP POLICY IF EXISTS "Service role can insert backups" ON public.user_backups;

CREATE POLICY "Users can insert their own backups"
  ON public.user_backups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4) Storage: remove permissive Public Access on ideas bucket + prevent listing
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to ideas objects" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view idea images" ON storage.objects;
DROP POLICY IF EXISTS "Allow object uploads to ideas bucket" ON storage.objects;

-- Keep uploads scoped to authenticated only; direct public URLs still work via public bucket
CREATE POLICY "Authenticated can upload ideas objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ideas');

-- 5) Realtime: remove profiles from realtime publication
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles';
  END IF;
END $$;
