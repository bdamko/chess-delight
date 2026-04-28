-- Switch like function to SECURITY INVOKER (runs as caller, respects RLS)
CREATE OR REPLACE FUNCTION public.increment_moment_likes(moment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.moments
  SET likes = likes + 1
  WHERE id = moment_id
  RETURNING likes INTO new_count;
  RETURN new_count;
END;
$$;

-- Allow anyone to update ONLY the likes column (no other field can change)
CREATE POLICY "Anyone can like a moment"
ON public.moments FOR UPDATE
USING (true)
WITH CHECK (true);

-- Restrict column-level update to just `likes` for anon/authenticated
REVOKE UPDATE ON public.moments FROM anon, authenticated;
GRANT UPDATE (likes) ON public.moments TO anon, authenticated;