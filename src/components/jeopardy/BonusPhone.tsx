import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LockKeyhole, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BenniPhoneRemote } from "./BenniPhoneRemote";
import { readBonusGuest, sendBonusGuess, type BonusGuestState } from "@/lib/bonus-pass-api";

function midpoint(s: BonusGuestState): number {
  const steps = Math.max(0, Math.floor((s.max - s.min) / s.step));
  return Number((s.min + Math.floor(steps / 2) * s.step).toPrecision(14));
}
const formatted = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 12 });

function parseTypedGuess(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function validGuess(raw: string, state: BonusGuestState): number | null {
  const value = parseTypedGuess(raw);
  if (value === null || value < state.min || value > state.max) return null;
  const steps = (value - state.min) / state.step;
  return Math.abs(steps - Math.round(steps)) <= 1e-8 ? value : null;
}

function nearestSliderGuess(value: number, state: BonusGuestState): number {
  const maxSteps = Math.floor((state.max - state.min) / state.step);
  const steps = Math.max(0, Math.min(maxSteps, Math.round((value - state.min) / state.step)));
  return Number((state.min + steps * state.step).toPrecision(14));
}

export function BonusPhone({ code }: { code: string }) {
  const [state, setState] = useState<BonusGuestState | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [typedGuess, setTypedGuess] = useState("");
  const [handoff, setHandoff] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastPlayer = useRef<number | null>(null);
  const lastStatus = useRef<BonusGuestState["status"] | null>(null);
  const resetGuess = (round: BonusGuestState) => {
    const next = midpoint(round);
    setGuess(next);
    setTypedGuess(String(next));
  };

  useEffect(() => {
    let alive = true;
    const reload = async () => {
      try {
        const fresh = await readBonusGuest(code);
        if (!alive) return;
        // When the host activates a later round, the same phone/code becomes ready again.
        if (fresh.status === "collecting" && lastStatus.current !== "collecting") {
          setHandoff(false);
          setSubmittedName("");
          resetGuess(fresh);
        }
        lastStatus.current = fresh.status;
        setState(fresh);
        setError("");
        if (lastPlayer.current !== fresh.nextPlayer) {
          lastPlayer.current = fresh.nextPlayer;
          resetGuess(fresh);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen.");
      }
    };
    void reload();
    const timer = window.setInterval(() => { if (!document.hidden) void reload(); }, 1800);
    const onVisible = () => { if (!document.hidden) void reload(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [code]);

  const isFinished = state && (state.status === "ready" || state.status === "revealed");
  const player = state?.players[state.nextPlayer];
  const typedValue = state ? validGuess(typedGuess, state) : null;
  const guessValid = typedValue !== null && guess !== null &&
    Math.abs(typedValue - guess) <= Math.max(1e-8, Math.abs(typedValue) * 1e-12);

  const onSliderChange = (value: number) => {
    setGuess(value);
    setTypedGuess(String(value));
  };

  const onNumberChange = (raw: string) => {
    setTypedGuess(raw);
    if (!state) return;
    const value = parseTypedGuess(raw);
    if (value !== null && value >= state.min && value <= state.max) {
      // Follow the typed value as closely as the configured slider allows.
      // Submit is disabled until the text is a valid step-aligned value.
      setGuess(nearestSliderGuess(value, state));
    }
  };

  const send = async () => {
    if (!state || !player || guess === null || !guessValid || busy) return;
    setBusy(true);
    setError("");
    try {
      await sendBonusGuess(code, state.nextPlayer, guess);
      setSubmittedName(player.name);
      setHandoff(true);
      // Never put the previous value into the next player's UI.
      setGuess(null);
      setTypedGuess("");
      lastPlayer.current = null;
      const fresh = await readBonusGuest(code);
      setState(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tipp konnte nicht gespeichert werden.");
    } finally { setBusy(false); }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5 rounded-3xl border border-primary/25 bg-[#17132f] p-5 text-white shadow-[0_16px_65px_rgba(0,0,0,.4)]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#baabfa]">
            <Smartphone className="h-4 w-4" /> {state?.status === "waiting" || state?.status === "revealed" ? "handyschmendi" : "Alle schätzen"}
          </span>
          <span className="text-xs tabular-nums text-[#afa3c6]">
            {state?.status === "waiting" || state?.status === "revealed" ? "Benni-TV" : state ? `${Math.min(state.nextPlayer + (handoff ? 0 : 1), state.players.length)} / ${state.players.length}` : code}
          </span>
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        {!state ? (
          <div className="space-y-3 py-8 text-center text-sm text-[#c8bce1]">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin" />
            Verbindung wird geprüft …
          </div>
        ) : state.status === "waiting" || state.status === "revealed" ? (
          <div className="space-y-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h1 className="font-display text-2xl">Handy verbunden!</h1>
            <p className="text-sm text-[#c2b6d7]">
              {state.status === "waiting"
                ? "Alles bereit. Bei der nächsten Schätzrunde erscheint die Frage automatisch."
                : "Die Runde ist vorbei. Die nächste Schätzfrage erscheint automatisch."}
            </p>
            <p className="text-xs text-[#9f93ba]">Lass diese Seite geöffnet. Kein neuer Code nötig.</p>
            <BenniPhoneRemote code={code} />
          </div>
        ) : handoff ? (
          <div className="space-y-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h1 className="font-display text-2xl">Tipp gespeichert!</h1>
            <p className="text-sm text-[#b9afd3]">Die Schätzung von {submittedName} bleibt geheim.</p>
            {isFinished ? (
              <p className="font-semibold text-[#e6d4a2]">Alle fertig! Jetzt auf den Fernseher schauen.</p>
            ) : (
              <>
                <p className="font-semibold">Handy an {player?.name} weitergeben.</p>
                <Button className="w-full rounded-xl py-6 font-display" onClick={() => {
                  setHandoff(false);
                  resetGuess(state);
                  lastPlayer.current = state.nextPlayer;
                }}>
                  Nächster Spieler
                </Button>
              </>
            )}
          </div>
        ) : isFinished ? (
          <div className="space-y-3 py-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h1 className="font-display text-2xl">Alle Tipps abgegeben!</h1>
            <p className="text-sm text-[#c2b6d7]">Die Auflösung kommt gleich auf dem großen Bildschirm.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <span className="mx-auto block h-3 w-3 rounded-full" style={{ backgroundColor: player?.color || "#a992ff" }} />
              <h1 className="font-display text-2xl">{player?.name}</h1>
              <p className="text-sm leading-relaxed text-[#cec4e2]">{state.question}</p>
            </div>
            <div className="space-y-4 rounded-2xl bg-white/[.035] p-4">
              <p className="text-center font-display text-3xl tabular-nums">{formatted(guess ?? midpoint(state))} <span className="text-lg text-[#b8abd5]">{state.unit}</span></p>
              <input
                aria-label="Deine geheime Schätzung"
                className="h-8 w-full cursor-pointer accent-[#a894ff]"
                type="range" min={state.min} max={state.max} step={state.step}
                value={guess ?? midpoint(state)}
                onChange={e => onSliderChange(e.target.valueAsNumber)}
              />
              <div className="flex justify-between gap-2 text-xs tabular-nums text-[#afa3c6]">
                <span>{formatted(state.min)} {state.unit}</span>
                <span>{formatted(state.max)} {state.unit}</span>
              </div>
              <div className="space-y-2 text-left">
                <label htmlFor="bonus-guess-number" className="block text-sm font-medium text-[#ddd3f0]">
                  Oder Zahl direkt eingeben
                </label>
                <Input
                  id="bonus-guess-number"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={typedGuess}
                  onChange={e => onNumberChange(e.target.value)}
                  aria-invalid={!guessValid}
                  placeholder="Zahl eingeben"
                  className="h-12 border-white/20 bg-[#211c3c] text-center text-lg font-semibold tabular-nums text-white"
                />
                {!guessValid && (
                  <p role="status" className="text-xs text-amber-200">
                    Bitte einen Wert von {formatted(state.min)} bis {formatted(state.max)}
                    {state.step !== 1 ? ` in Schritten von ${formatted(state.step)}` : ""} eingeben.
                    {typedGuess.trim() && parseTypedGuess(typedGuess) !== null
                      ? " Der Slider zeigt den nächstmöglichen Schritt." : ""}
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full rounded-xl py-6 font-display text-base" disabled={busy || !guessValid} onClick={() => void send()}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              {busy ? "Wird sicher gespeichert …" : "Tipp bestätigen"}
            </Button>
            <p className="text-center text-xs text-[#aba0c5]">Nach dem Bestätigen ist dein Tipp nicht mehr sichtbar.</p>
          </div>
        )}
      </div>
    </main>
  );
}
