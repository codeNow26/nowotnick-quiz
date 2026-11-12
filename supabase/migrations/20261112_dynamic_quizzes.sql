-- Run ONCE in Supabase SQL Editor BEFORE publishing the new application.
-- No UPDATE, DELETE, ALTER or INSERT is performed against public.quiz_data.
-- The transaction first backs up every legacy row in a non-public schema.
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.quiz_data WHERE id IN (
    '2f167918-a027-44f0-a012-422e802a7bef',
    '1dd72322-8420-43a8-a504-6665757232c6',
    '6a14ed4b-febe-483e-bf11-8211daa4b947',
    'ba7f1a27-2381-4c78-9967-e35679b112a8'
  )) <> 4 THEN
    RAISE EXCEPTION 'STOP: At least one legacy quiz is missing. No changes were applied.';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS quiz_backups;
REVOKE ALL ON SCHEMA quiz_backups FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS quiz_backups.legacy_before_dynamic_v1 (
  id uuid PRIMARY KEY,
  row_data jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE quiz_backups.legacy_before_dynamic_v1 FROM PUBLIC, anon, authenticated;
ALTER TABLE quiz_backups.legacy_before_dynamic_v1 ENABLE ROW LEVEL SECURITY;
-- Re-running never overwrites the first backup. All columns, including metadata,
-- nested questions, image URLs and unknown settings, are retained as JSON.
INSERT INTO quiz_backups.legacy_before_dynamic_v1 (id, row_data)
SELECT id, to_jsonb(q) FROM public.quiz_data q
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF (SELECT count(*) FROM quiz_backups.legacy_before_dynamic_v1 WHERE id IN (
    '2f167918-a027-44f0-a012-422e802a7bef', '1dd72322-8420-43a8-a504-6665757232c6',
    '6a14ed4b-febe-483e-bf11-8211daa4b947', 'ba7f1a27-2381-4c78-9967-e35679b112a8'
  )) <> 4 THEN RAISE EXCEPTION 'STOP: Legacy backup is incomplete.'; END IF;
END $$;

-- Separate storage: management cannot accidentally delete a legacy record.
CREATE TABLE public.custom_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  data jsonb NOT NULL CHECK ((
    jsonb_typeof(data) = 'object'
    AND jsonb_typeof(data->'categories') = 'array'
    AND jsonb_typeof(data->'meta') = 'object'
    AND jsonb_typeof(data->'meta'->'title') = 'string'
    AND length(trim(data->'meta'->>'title')) BETWEEN 1 AND 120
  ) IS TRUE),
  title text GENERATED ALWAYS AS (data->'meta'->>'title') STORED,
  archived boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX custom_quizzes_listing_idx ON public.custom_quizzes (archived, updated_at DESC, id);
CREATE FUNCTION public.bump_custom_quiz_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.revision := OLD.revision + 1;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;
CREATE TRIGGER custom_quiz_revision BEFORE UPDATE ON public.custom_quizzes
FOR EACH ROW EXECUTE FUNCTION public.bump_custom_quiz_revision();
ALTER TABLE public.custom_quizzes ENABLE ROW LEVEL SECURITY;
-- Intentionally PUBLIC management, as requested. There is no ownership/login yet.
-- Later auth can replace these policies and add owner_id without changing URLs.
CREATE POLICY custom_quizzes_public_read ON public.custom_quizzes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY custom_quizzes_public_create ON public.custom_quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY custom_quizzes_public_edit ON public.custom_quizzes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY custom_quizzes_public_delete ON public.custom_quizzes FOR DELETE TO anon, authenticated USING (true);
REVOKE ALL ON public.custom_quizzes FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.custom_quizzes TO anon, authenticated;
GRANT INSERT (slug, data) ON public.custom_quizzes TO anon, authenticated;
GRANT UPDATE (data, archived, updated_at) ON public.custom_quizzes TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
