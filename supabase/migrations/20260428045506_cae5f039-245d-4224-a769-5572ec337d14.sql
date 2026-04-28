-- Remove overly-permissive update policy; likes are handled via the function only
DROP POLICY IF EXISTS "Anyone can update likes" ON public.moments;

-- Lock down the SECURITY DEFINER function to only the app-facing roles
REVOKE ALL ON FUNCTION public.increment_moment_likes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_moment_likes(UUID) TO anon, authenticated;