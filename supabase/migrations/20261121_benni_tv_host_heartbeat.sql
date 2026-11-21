-- Make Benni-TV commands dependable: confirm that the paired quiz screen is alive.
-- This heartbeat is authenticated by the existing host session token.
BEGIN;

ALTER TABLE public.bonus_pass_sessions
  ADD COLUMN IF NOT EXISTS tv_host_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.bonus_tv_heartbeat(
  p_id uuid, p_host_token uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
  UPDATE public.bonus_pass_sessions
  SET tv_host_seen_at=now()
  WHERE id=p_id AND host_token=p_host_token AND expires_at>now();
  RETURN FOUND;
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
    'busy',s.tv_request_state <> 'idle'
      AND s.tv_request_at > now() - interval '45 seconds',
    'status',s.tv_request_state,
    'hostOnline',s.tv_host_seen_at IS NOT NULL
      AND s.tv_host_seen_at > now() - interval '15 seconds'
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
  IF s.tv_host_seen_at IS NULL OR s.tv_host_seen_at <= now() - interval '15 seconds' THEN
    RAISE EXCEPTION 'Quizbildschirm nicht erreichbar. Prüfe, ob die Quizseite auf dem Laptop noch geöffnet ist und der richtige QR-Code verbunden wurde.';
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

REVOKE ALL ON FUNCTION public.bonus_tv_heartbeat(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bonus_tv_heartbeat(uuid,uuid) TO anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
