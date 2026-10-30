
-- Remove duplicate categories, keeping only the newest row per (user_email, category_id)
DELETE FROM public.categories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_email, category_id) id
  FROM public.categories
  ORDER BY user_email, category_id, created_at DESC NULLS LAST
);

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_catid 
ON public.categories(user_email, category_id);
