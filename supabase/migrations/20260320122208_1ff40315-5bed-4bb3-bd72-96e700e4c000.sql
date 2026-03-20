CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  category_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_email, category_id, month, year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING ((auth.jwt() ->> 'email'::text) = user_email);
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK ((auth.jwt() ->> 'email'::text) = user_email);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING ((auth.jwt() ->> 'email'::text) = user_email);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING ((auth.jwt() ->> 'email'::text) = user_email);