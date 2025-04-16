
-- Enable Row Level Security for transactions and categories tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to update their own transactions
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to delete their own transactions
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to view their own categories
CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to insert their own categories
CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to update their own categories
CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Policy for users to delete their own categories
CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = user_email
  ));

-- Set up realtime replication for these tables
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;

-- Create function to enable realtime for tables
CREATE OR REPLACE FUNCTION public.alter_table_replica_identity(
  table_name text,
  replica_identity text
) RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY %s', table_name, replica_identity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add tables to the realtime publication
CREATE OR REPLACE FUNCTION public.add_tables_to_publication(
  table_names text[]
) RETURNS void AS $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
