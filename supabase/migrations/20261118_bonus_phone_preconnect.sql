-- Prepare one phone before the quiz starts, then reuse the same code for every bonus round.
-- The original bonus_pass_* functions stay compatible with already running sessions.
BEGIN;
ALTER TABLE public.bonus_pass_sessions
  DROP CONSTRAINT IF EXISTS bonus_pass_sessions_status_check;
ALTER TABLE public.bonus_pass_sessions
  ADD CONSTRAINT bonus_pass_sessions_status_check
  CHECK (status IN ('waiting', 'collecting', 'ready', 'revealed'));

CREATE OR REPLACE FUNCTION public.bonus_pass_prepare(
  p_code text, p_host_token uuid, p_quiz_id uuid, p_players jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE new_id uuid;
BEGIN
  IF p_code IS NULL OR p_code !~ '^[A-Z2-9]{10}$'
     OR p_host_token IS NULL OR p_quiz_id IS NULL
     OR p_players IS NULL OR jsonb_typeof(p_players) <> 'array'
     OR jsonb_array_length(p_players) NOT BETWEEN 1 AND 6
     OR EXISTS (
       SELECT 1 FROM jsonb_array_elements(p_players) AS element(item)
       WHERE jsonb_typeof(element.item) <> 'object'
         OR jsonb_typeof(element.item->'name') <> 'string'
         OR length(trim(element.item->>'name')) NOT BETWEEN 1 AND 80
     )
  THEN RAISE EXCEPTION 'Ungültige Spielerdaten'; END IF;
  INSERT INTO public.bonus_pass_sessions (
    code,host_token,quiz_id,question,target,unit,range_min,range_max,range_step,players,status
  ) VALUES (p_code,p_host_token,p_quiz_id,'',0,'',0,1,1,p_players,'waiting')
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.bonus_pass_activate(
  p_id uuid, p_host_token uuid, p_question text, p_target numeric,
  p_unit text, p_min numeric, p_max numeric, p_step numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
   WHERE id=p_id AND host_token=p_host_token AND expires_at>now()
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vorbereitete Handy-Verbindung nicht gefunden oder abgelaufen'; END IF;
  IF length(trim(coalesce(p_question,''))) NOT BETWEEN 1 AND 500
    OR length(coalesce(p_unit,''))>32
    OR p_target IS NULL OR p_min IS NULL OR p_max IS NULL OR p_step IS NULL
    OR p_max <= p_min OR p_step <= 0 OR p_target < p_min OR p_target > p_max
  THEN RAISE EXCEPTION 'Ungültige Schätzfrage'; END IF;
  UPDATE public.bonus_pass_sessions SET
    question=trim(p_question),target=p_target,unit=coalesce(p_unit,''),
    range_min=p_min,range_max=p_max,range_step=p_step,
    guesses='[]'::jsonb,next_player=0,status='collecting',
    expires_at=now()+interval '12 hours'
  WHERE id=s.id;
  RETURN jsonb_build_object('status','collecting','submitted',0,'guesses','[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.bonus_pass_prepare(text,uuid,uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_pass_activate(uuid,uuid,text,numeric,text,numeric,numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bonus_pass_prepare(text,uuid,uuid,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_pass_activate(uuid,uuid,text,numeric,text,numeric,numeric,numeric) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
