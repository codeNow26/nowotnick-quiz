-- Remote Benni-TV commands reuse the existing, already protected phone pairing.
-- No quiz questions or media objects are changed.
BEGIN;

ALTER TABLE public.bonus_pass_sessions
  ADD COLUMN IF NOT EXISTS tv_clips jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tv_request_seq bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tv_request_clip text,
  ADD COLUMN IF NOT EXISTS tv_request_state text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS tv_request_at timestamptz;

ALTER TABLE public.bonus_pass_sessions
  ADD CONSTRAINT bonus_pass_tv_request_state_check
  CHECK (tv_request_state IN ('idle','pending','playing'));

CREATE OR REPLACE FUNCTION public.bonus_tv_config(
  p_id uuid, p_host_token uuid, p_clips jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
  WHERE id=p_id AND host_token=p_host_token AND expires_at>now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Handy-Verbindung abgelaufen oder nicht gefunden'; END IF;
  IF p_clips IS NULL OR jsonb_typeof(p_clips) <> 'array'
    OR jsonb_array_length(p_clips) > 12
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_clips) AS entry(v)
      WHERE jsonb_typeof(entry.v) <> 'object'
        OR jsonb_typeof(entry.v->'id') <> 'string'
        OR length(entry.v->>'id') NOT BETWEEN 1 AND 80
        OR jsonb_typeof(entry.v->'title') <> 'string'
        OR length(entry.v->>'title') > 80
    )
    OR (SELECT count(DISTINCT entry.v->>'id')
        FROM jsonb_array_elements(p_clips) AS entry(v)) <> jsonb_array_length(p_clips)
  THEN RAISE EXCEPTION 'Ungültige Videoliste'; END IF;
  UPDATE public.bonus_pass_sessions SET tv_clips=p_clips
  WHERE id=s.id;
  RETURN jsonb_build_object('count',jsonb_array_length(p_clips));
END $fn$;

CREATE OR REPLACE FUNCTION public.bonus_tv_guest(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
  WHERE code=p_code AND expires_at>now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Handy-Verbindung abgelaufen oder nicht gefunden'; END IF;
  RETURN jsonb_build_object(
    'clips',s.tv_clips,
    'busy', s.tv_request_state <> 'idle'
      AND s.tv_request_at > now() - interval '45 seconds',
    'status',s.tv_request_state
  );
END $fn$;

CREATE OR REPLACE FUNCTION public.bonus_tv_request(
  p_code text, p_clip_id text
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
DECLARE seq bigint;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
  WHERE code=p_code AND expires_at>now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Handy-Verbindung abgelaufen oder nicht gefunden'; END IF;
  IF s.status NOT IN ('waiting','revealed') THEN
    RAISE EXCEPTION 'Während der Schätzrunde ist Benni-TV gesperrt';
  END IF;
  IF s.tv_request_state <> 'idle'
     AND s.tv_request_at > now() - interval '45 seconds' THEN
    RAISE EXCEPTION 'Ein Benni-Clip wird bereits gestartet oder abgespielt';
  END IF;
  IF p_clip_id IS NULL OR (
    (p_clip_id <> '__random__' OR jsonb_array_length(s.tv_clips)=0)
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(s.tv_clips) AS entry(v)
      WHERE entry.v->>'id'=p_clip_id
    )
  ) THEN RAISE EXCEPTION 'Dieser Clip ist nicht mehr verfügbar'; END IF;
  UPDATE public.bonus_pass_sessions SET
    tv_request_seq=tv_request_seq+1,
    tv_request_clip=p_clip_id,
    tv_request_state='pending',
    tv_request_at=now()
  WHERE id=s.id
  RETURNING tv_request_seq INTO seq;
  RETURN seq;
END $fn$;

CREATE OR REPLACE FUNCTION public.bonus_tv_host(
  p_id uuid,p_host_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
  WHERE id=p_id AND host_token=p_host_token AND expires_at>now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Handy-Verbindung abgelaufen oder nicht gefunden'; END IF;
  RETURN jsonb_build_object('seq',s.tv_request_seq,'clipId',s.tv_request_clip,
                            'status',s.tv_request_state,
                            'requestedAt',s.tv_request_at);
END $fn$;

CREATE OR REPLACE FUNCTION public.bonus_tv_ack(
  p_id uuid,p_host_token uuid,p_seq bigint,p_action text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE previous_state text;
BEGIN
  IF p_action NOT IN ('start','done') THEN RAISE EXCEPTION 'Ungültige Aktion'; END IF;
  UPDATE public.bonus_pass_sessions SET
    tv_request_state=CASE WHEN p_action='start' THEN 'playing' ELSE 'idle' END,
    tv_request_at=now()
  WHERE id=p_id AND host_token=p_host_token AND expires_at>now()
    AND tv_request_seq=p_seq AND (
      (p_action='start' AND tv_request_state='pending') OR
      (p_action='done' AND tv_request_state='playing')
    )
  RETURNING tv_request_state INTO previous_state;
  RETURN FOUND;
END $fn$;

REVOKE ALL ON FUNCTION public.bonus_tv_config(uuid,uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_tv_guest(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_tv_request(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_tv_host(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_tv_ack(uuid,uuid,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bonus_tv_config(uuid,uuid,jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_tv_guest(text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_tv_request(text,text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_tv_host(uuid,uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_tv_ack(uuid,uuid,bigint,text) TO anon,authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
