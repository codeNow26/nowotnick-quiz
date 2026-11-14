-- Run once in Supabase > SQL Editor before using video uploads.
-- Additive: no quiz_data/custom_quizzes rows are modified or deleted.
-- Matches the app's current public editing model (no login).
-- Anyone can upload MP4/WebM to this bucket; URLs are public. No anonymous
-- UPDATE/DELETE policy: uploads cannot overwrite or delete existing videos.
-- Removing a question's video only removes its link. Keep files referenced
-- by duplicated quizzes, local drafts and backups; cleanup is manual.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quiz-videos', 'quiz-videos', true, 52428800, ARRAY['video/mp4','video/webm'])
ON CONFLICT (id) DO NOTHING;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='quiz_video_insert_v1') THEN
    CREATE POLICY quiz_video_insert_v1 ON storage.objects FOR INSERT TO anon, authenticated
      WITH CHECK (bucket_id = 'quiz-videos');
  END IF;
END $$;
COMMIT;
