import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LockKeyhole, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenniPhoneRemote } from "./BenniPhoneRemote";
import { readBonusGuest, sendBonusGuess, type BonusGuestState } from "@/lib/bonus-pass-api";

function midpoint(s: BonusGuestState): number {
  const steps = Math.max(0, Math.floor((s.max - s.min) / s.step));
  return Number((s.min + Math.floor(steps / 2) * s.step).toPrecision(14));
}
const formatted = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 12 });

export function BonusPhone({ code }: { code: string }) {
  const [state, setState] = useState<BonusGuestState | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [handoff, setHandoff] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastPlayer = useRef<number | null>(null);
  const lastStatus = useRef<BonusGuestState["status"] | null>(null);

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
          setGuess(midpoint(fresh));
        }
        lastStatus.current = fresh.status;
        setState(fresh);
        setError("");
        if (lastPlayer.current !== fresh.nextPlayer) {
          lastPlayer.current = fresh.nextPlayer;
          setGuess(midpoint(fresh));
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
  const send = async () => {
    if (!state || !player || guess === null || busy) return;
    setBusy(true);
    setError("");
    try {
      await sendBonusGuess(code, state.nextPlayer, guess);
      setSubmittedName(player.name);
      setHandoff(true);
      // Never put the previous value into the next player's UI.
      setGuess(null);
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
                  setGuess(midpoint(state));
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
                onChange={e => setGuess(e.target.valueAsNumber)}
              />
              <div className="flex justify-between gap-2 text-xs tabular-nums text-[#afa3c6]">
                <span>{formatted(state.min)} {state.unit}</span>
                <span>{formatted(state.max)} {state.unit}</span>
              </div>
            </div>
            <Button className="w-full rounded-xl py-6 font-display text-base" disabled={busy || guess === null} onClick={() => void send()}>
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
