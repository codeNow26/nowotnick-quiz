-- Add audio uploads to the existing quiz-videos media bucket.
-- Run once in Supabase SQL Editor before uploading MP3/WAV/OGG/M4A/WebM.
-- Additive: no quiz or media rows are changed, existing videos remain untouched.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-videos', 'quiz-videos', true, 52428800,
  ARRAY[
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'
  ]
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = (
  SELECT array_agg(DISTINCT mime)
  FROM unnest(
    coalesce(storage.buckets.allowed_mime_types, ARRAY[]::text[]) ||
    ARRAY['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/webm']
  ) AS mime
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='quiz_video_insert_v1'
  ) THEN
    CREATE POLICY quiz_video_insert_v1
      ON storage.objects FOR INSERT TO anon, authenticated
      WITH CHECK (bucket_id = 'quiz-videos');
  END IF;
END $$;
COMMIT;
