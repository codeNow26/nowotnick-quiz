-- Gemeinsame Schätzrunden: anonyme, kurzlebige Handysitzungen.
-- Dieses SQL einmal im Supabase SQL Editor ausführen, bevor die neue Preview mit Handy genutzt wird.
-- Keine Änderungen an quiz_data oder custom_quizzes. Keine direkten Tabellenrechte für Besucher.
BEGIN;

CREATE TABLE IF NOT EXISTS public.bonus_pass_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_token uuid NOT NULL,
  quiz_id uuid NOT NULL,
  question text NOT NULL,
  target numeric NOT NULL,
  unit text NOT NULL DEFAULT '',
  range_min numeric NOT NULL,
  range_max numeric NOT NULL,
  range_step numeric NOT NULL,
  players jsonb NOT NULL,
  guesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_player integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'ready', 'revealed')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bonus_pass_code_shape CHECK (code ~ '^[A-Z2-9]{10}$'),
  CONSTRAINT bonus_pass_numeric CHECK (
    range_max > range_min AND range_step > 0
    AND target BETWEEN range_min AND range_max
  ),
  CONSTRAINT bonus_pass_players CHECK (
    jsonb_typeof(players) = 'array'
    AND jsonb_array_length(players) BETWEEN 1 AND 6
  )
);
CREATE INDEX IF NOT EXISTS bonus_pass_expiry_idx ON public.bonus_pass_sessions(expires_at);
ALTER TABLE public.bonus_pass_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bonus_pass_sessions FROM PUBLIC, anon, authenticated;
-- Security definer RPCs below are the only entry points. No SELECT policy.

CREATE OR REPLACE FUNCTION public.bonus_pass_create(
  p_code text, p_host_token uuid, p_quiz_id uuid, p_question text,
  p_target numeric, p_unit text, p_min numeric, p_max numeric,
  p_step numeric, p_players jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE new_id uuid;
BEGIN
  IF p_code !~ '^[A-Z2-9]{10}$'
     OR length(trim(coalesce(p_question, ''))) NOT BETWEEN 1 AND 500
     OR length(coalesce(p_unit, '')) > 32
     OR p_target IS NULL OR p_min IS NULL OR p_max IS NULL OR p_step IS NULL
     OR p_max <= p_min OR p_step <= 0 OR p_target < p_min OR p_target > p_max
     OR p_players IS NULL OR jsonb_typeof(p_players) <> 'array'
     OR jsonb_array_length(p_players) NOT BETWEEN 1 AND 6
     OR EXISTS (
       SELECT 1 FROM jsonb_array_elements(p_players) AS element(item)
       WHERE jsonb_typeof(element.item) <> 'object'
             OR jsonb_typeof(element.item->'name') <> 'string'
             OR length(trim(element.item->>'name')) NOT BETWEEN 1 AND 80
     )
  THEN RAISE EXCEPTION 'Ungültige Angaben zur Schätzrunde'; END IF;
  INSERT INTO public.bonus_pass_sessions(
    code, host_token, quiz_id, question, target, unit,
    range_min, range_max, range_step, players
  ) VALUES (
    p_code, p_host_token, p_quiz_id, trim(p_question), p_target, coalesce(p_unit, ''),
    p_min, p_max, p_step, p_players
  ) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.bonus_pass_guest(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
    WHERE code = p_code AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Schätzrunde nicht gefunden oder abgelaufen'; END IF;
  -- Never return target, host_token or previous guesses to a phone.
  RETURN jsonb_build_object(
    'code', s.code, 'question', s.question, 'unit', s.unit,
    'min', s.range_min, 'max', s.range_max, 'step', s.range_step,
    'players', s.players, 'nextPlayer', s.next_player,
    'status', s.status, 'submitted', s.next_player
  );
END $$;

CREATE OR REPLACE FUNCTION public.bonus_pass_submit(
  p_code text, p_player integer, p_guess numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s public.bonus_pass_sessions%ROWTYPE; next_index integer;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
    WHERE code = p_code AND expires_at > now()
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Schätzrunde nicht gefunden oder abgelaufen'; END IF;
  IF s.status <> 'collecting' OR p_player IS DISTINCT FROM s.next_player THEN
    RAISE EXCEPTION 'Dieser Spieler ist nicht mehr an der Reihe';
  END IF;
  IF p_guess IS NULL OR p_guess < s.range_min OR p_guess > s.range_max
      OR abs((p_guess - s.range_min) / s.range_step
        - round((p_guess - s.range_min) / s.range_step)) > 0.00000001
  THEN RAISE EXCEPTION 'Ungültiger Sliderwert'; END IF;
  next_index := s.next_player + 1;
  UPDATE public.bonus_pass_sessions
  SET guesses = s.guesses || jsonb_build_array(p_guess),
      next_player = next_index,
      status = CASE WHEN next_index >= jsonb_array_length(s.players) THEN 'ready' ELSE 'collecting' END
  WHERE id = s.id;
  -- Confirm receipt without returning the value or earlier guesses.
  RETURN jsonb_build_object(
    'submitted', next_index,
    'status', CASE WHEN next_index >= jsonb_array_length(s.players) THEN 'ready' ELSE 'collecting' END
  );
END $$;

CREATE OR REPLACE FUNCTION public.bonus_pass_host(
  p_id uuid, p_host_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
    WHERE id = p_id AND host_token = p_host_token AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Sitzung nicht gefunden oder abgelaufen'; END IF;
  RETURN jsonb_build_object(
    'status', s.status, 'submitted', s.next_player,
    'guesses', CASE WHEN s.status = 'revealed' THEN s.guesses ELSE '[]'::jsonb END
  );
END $$;

CREATE OR REPLACE FUNCTION public.bonus_pass_reveal(
  p_id uuid, p_host_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s public.bonus_pass_sessions%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.bonus_pass_sessions
    WHERE id = p_id AND host_token = p_host_token AND expires_at > now()
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sitzung nicht gefunden oder abgelaufen'; END IF;
  IF s.status NOT IN ('ready', 'revealed') THEN
    RAISE EXCEPTION 'Es fehlen noch Schätzungen'; END IF;
  UPDATE public.bonus_pass_sessions SET status = 'revealed' WHERE id = s.id;
  RETURN jsonb_build_object('status', 'revealed', 'submitted', s.next_player, 'guesses', s.guesses);
END $$;

REVOKE ALL ON FUNCTION public.bonus_pass_create(text,uuid,uuid,text,numeric,text,numeric,numeric,numeric,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_pass_guest(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_pass_submit(text,integer,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_pass_host(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bonus_pass_reveal(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bonus_pass_create(text,uuid,uuid,text,numeric,text,numeric,numeric,numeric,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_pass_guest(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_pass_submit(text,integer,numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_pass_host(uuid,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bonus_pass_reveal(uuid,uuid) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
