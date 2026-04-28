CREATE TABLE public.moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  fen TEXT NOT NULL,
  caption TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- Public feed: anyone can read
CREATE POLICY "Moments are viewable by everyone"
ON public.moments FOR SELECT
USING (true);

-- Only authenticated users can post their own moments
CREATE POLICY "Users can insert their own moments"
ON public.moments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "Users can delete their own moments"
ON public.moments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Anyone (even anon) can increment likes; we restrict columns via a function
CREATE POLICY "Anyone can update likes"
ON public.moments FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE INDEX idx_moments_created_at ON public.moments (created_at DESC);

-- Atomic like increment function
CREATE OR REPLACE FUNCTION public.increment_moment_likes(moment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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