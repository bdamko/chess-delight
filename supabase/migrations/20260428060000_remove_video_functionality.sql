-- Remove video functionality from moments
-- Drop video_url column and related storage bucket

-- First, delete all existing moments since they require video_url
DELETE FROM public.moments;

-- Drop the video_url column
ALTER TABLE public.moments DROP COLUMN video_url;

-- Remove the moment-videos storage bucket
DELETE FROM storage.buckets WHERE id = 'moment-videos';

-- Drop policies related to moment-videos
DROP POLICY IF EXISTS "Moment videos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload moment videos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own moment videos" ON storage.objects;