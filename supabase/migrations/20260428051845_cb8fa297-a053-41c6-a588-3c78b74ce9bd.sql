-- Wipe and require video on moments
DELETE FROM public.moments;
ALTER TABLE public.moments ADD COLUMN video_url text NOT NULL;

-- Comments table
CREATE TABLE public.moment_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX moment_comments_moment_id_idx ON public.moment_comments(moment_id, created_at);

ALTER TABLE public.moment_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.moment_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own comments"
  ON public.moment_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.moment_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('moment-videos', 'moment-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Moment videos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moment-videos');

-- Authenticated upload into own folder (path starts with their user id)
CREATE POLICY "Users can upload moment videos to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moment-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own moment videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moment-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );