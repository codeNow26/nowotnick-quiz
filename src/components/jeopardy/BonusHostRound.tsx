import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, LockKeyhole, Smartphone, Sparkles, Trophy, X } from "lucide-react";
import { PairingQrCode } from "./PairingQrCode";
import { Button } from "@/components/ui/button";
import { bonusQuestionError, bonusRanking, type BonusQuestion } from "@/lib/bonus-rounds";
import { activateBonusSession, createBonusSession, readBonusHost, revealBonus, type BonusHostState, type BonusPlayer, type BonusSession } from "@/lib/bonus-pass-api";

interface BonusHostProps {
  quizId: string;
  roundNumber: number;
  totalRounds: number;
  question: BonusQuestion;
  players: BonusPlayer[];
  preparedSession?: BonusSession | null;
  onAward: (winners: number[], points: number) => void;
  onClose: () => void;
}

const shown = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 12 });

export function BonusHostRound({
  quizId, roundNumber, totalRounds, question, players, preparedSession, onAward, onClose,
}: BonusHostProps) {
  const [session, setSession] = useState<BonusSession | null>(preparedSession ?? null);
  const activationStarted = useRef(false);
  const [state, setState] = useState<BonusHostState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scored = useRef(false);
  const safeError = bonusQuestionError(question);
  const url = typeof window === "undefined" || !session ? "" : `${window.location.origin}/mitraten/${session.code}`;
  const submitted = state?.submitted ?? 0;
  const allGuesses = state?.status === "revealed" && Array.isArray(state.guesses) && state.guesses.length === players.length
    ? state.guesses : null;
  const ranking = allGuesses && question.target !== undefined ? bonusRanking(allGuesses, question.target) : [];
  const winners = ranking.filter(r => r.winner);

  useEffect(() => {
    if (!preparedSession || activationStarted.current) return;
    activationStarted.current = true;
    let alive = true;
    setBusy(true);
    setError("");
    void activateBonusSession(preparedSession, question)
      .then(next => { if (alive) setState(next); })
      .catch(e => {
        if (alive) setError(e instanceof Error ? e.message : "Handy-Verbindung konnte nicht aktiviert werden.");
      })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [preparedSession, question]);

  useEffect(() => {
    if (!session || (preparedSession && (busy || !state)) || state?.status === "revealed") return;
    let alive = true;
    const check = async () => {
      try {
        const fresh = await readBonusHost(session);
        if (!alive) return;
        setState(fresh);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Verbindung unterbrochen.");
      }
    };
    void check();
    const timer = window.setInterval(() => { if (!document.hidden) void check(); }, 1600);
    const onVisibility = () => { if (!document.hidden) void check(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [session, state?.status, preparedSession, busy]);

  const create = async () => {
    if (busy || safeError) return;
    setBusy(true); setError("");
    try {
      const created = await createBonusSession(quizId, question, players);
      setSession(created);
      setState({ submitted: 0, status: "collecting", guesses: [] });
    } catch (e) { setError(e instanceof Error ? e.message : "Handy-Verbindung konnte nicht eingerichtet werden."); }
    finally { setBusy(false); }
  };
  const reveal = async () => {
    if (!session || busy || state?.status !== "ready") return;
    setBusy(true); setError("");
    try { setState(await revealBonus(session)); }
    catch (e) { setError(e instanceof Error ? e.message : "Auflösen fehlgeschlagen."); }
    finally { setBusy(false); }
  };
  const award = () => {
    if (scored.current || !allGuesses || !ranking.length) return;
    scored.current = true;
    onAward(winners.map(r => r.playerIndex), question.points);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Gemeinsame Schätzrunde"
      className="fixed inset-0 z-[150] overflow-y-auto bg-[#090818]/95 px-3 py-5 backdrop-blur-xl sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-primary/25 bg-[#181331] p-4 text-white shadow-[0_25px_100px_rgba(0,0,0,.5)] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-[#e7cd92]">
            <Sparkles className="h-4 w-4" /> Alle schätzen! <span className="text-[#a9a1bd]">{roundNumber} / {totalRounds}</span>
          </span>
          <button type="button" aria-label="Schätzrunde schließen" onClick={() => {
            if (session && state?.status !== "revealed" && !confirm("Die laufende Schätzrunde abbrechen? Bereits abgegebene Tipps bleiben auf dem Server, aber diese Runde wird nicht gewertet.")) return;
            onClose();
          }} className="rounded-lg p-2 text-[#b2a8cb] hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-center">
          <h2 className="font-display text-xl leading-snug sm:text-3xl">{question.question}</h2>
          {!allGuesses && <p className="text-sm text-[#b5a9ce]">Alle tippen geheim. Erst am Ende werden die Schätzungen enthüllt.</p>}
        </div>

        {error && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
        {safeError && <div role="alert" className="rounded-xl border border-amber-400/30 p-3 text-sm text-amber-200">{safeError} Bitte im Editor korrigieren.</div>}

        {!session ? (
          <div className="space-y-5 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15">
              <Smartphone className="h-8 w-8 text-[#b5a2ff]" />
            </div>
            <p className="text-sm text-[#c9bedf]">Ein Handy reicht. Alle stellen nacheinander ihren Slider ein und geben ihren Tipp verdeckt ab.</p>
            <Button size="lg" disabled={busy || !!safeError} className="rounded-xl px-8 font-display" onClick={() => void create()}>
              <Smartphone className="mr-2 h-5 w-5" /> {busy ? "Verbindung wird erstellt …" : "Handy verbinden"}
            </Button>
          </div>
        ) : allGuesses ? (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#e2c98b]">Die richtige Antwort</p>
              <p className="font-display text-4xl tabular-nums text-[#ffe39b] sm:text-5xl">{shown(question.target!)} <span className="text-xl">{question.unit}</span></p>
            </div>
            <div className="rounded-2xl border border-[#ab8e4a]/70 bg-[#3a3039] p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-9 w-9 shrink-0 text-[#ffda83]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ffda83]">{winners.length > 1 ? "Gleichstand! Gemeinsamer Sieg" : "Am nächsten dran!"}</p>
                  <p className="font-display text-2xl">{winners.map(w => players[w.playerIndex].name).join(" & ")}</p>
                  <p className="text-xs text-[#e4d0bc]">
                    {winners.map(w => `${shown(w.guess)} ${question.unit}`).join(" · ")} · nur {shown(winners[0]?.difference ?? 0)} {question.unit} daneben
                  </p>
                </div>
                <span className="font-display text-2xl tabular-nums text-[#ffda83]">+{shown(question.points)}</span>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/[.09] bg-white/[.03] p-4">
              <p className="text-sm font-semibold text-[#e5dff1]">So nah lagen eure Tipps</p>
              <div className="relative h-12 px-1">
                <div className="absolute left-1 right-1 top-7 h-2 rounded-full bg-[#554d72]" />
                {ranking.map(r => (
                  <div key={r.playerIndex} className="absolute top-[23px] h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-[#201933] shadow-[0_0_9px_rgba(255,255,255,.15)]"
                    title={`${players[r.playerIndex].name}: ${shown(r.guess)} ${question.unit}`}
                    style={{
                      left: `${Math.max(2, Math.min(98, ((r.guess - question.min) / (question.max - question.min)) * 96 + 2))}%`,
                      backgroundColor: players[r.playerIndex].color || "#a895ff",
                    }} />
                ))}
                <div className="absolute top-1 bottom-0 w-[2px] -translate-x-1/2 bg-[#ffe39b]"
                  style={{ left: `${Math.max(2, Math.min(98, ((question.target! - question.min) / (question.max - question.min)) * 96 + 2))}%` }}>
                  <span className="absolute -left-[5px] -top-1 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[#ffe39b]" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-[#aea3c6]">
                <span>{shown(question.min)} {question.unit}</span><span className="text-[#e5cb88]">Gold = richtig</span><span>{shown(question.max)} {question.unit}</span>
              </div>
            </div>
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.playerIndex}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${r.winner ? "border-[#b39a62]/55 bg-[#ab8d55]/10" : "border-white/[.06] bg-white/[.025]"}`}>
                  <span className="w-5 text-sm text-[#aea4c0]">{i + 1}.</span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: players[r.playerIndex].color }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{players[r.playerIndex].name}</span>
                  <span className="text-xs tabular-nums text-[#ccc2db]">{shown(r.guess)} {question.unit}</span>
                  <span className="min-w-[65px] text-right text-xs tabular-nums text-[#9e93b5]">±{shown(r.difference)}</span>
                </div>
              ))}
            </div>
            <Button className="w-full rounded-xl py-6 font-display" onClick={award}>
              <Trophy className="mr-2 h-5 w-5" /> Punkte vergeben und weiterspielen
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {!preparedSession && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[.04] p-4">
                <div className="rounded-2xl bg-white p-2">
                  <PairingQrCode value={url} />
                </div>
                <p className="text-center text-xs text-[#aea3c6]">
                  Code als Notlösung: <span className="font-mono tracking-wider text-[#d0c3f2]">{session.code}</span>
                </p>
              </div>
            )}
            <p className="text-center text-xs text-[#b4aaca]">
              {state?.status === "ready" ? "Alle Tipps sind eingegangen!" : `${submitted} von ${players.length} haben geschätzt`}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  {i < submitted ? <Check className="h-4 w-4 text-emerald-300" aria-label="Abgegeben" />
                    : i === submitted ? <Smartphone className="h-4 w-4 text-primary" aria-label="Am Zug" />
                    : <LockKeyhole className="h-3.5 w-3.5 text-[#84789a]" aria-label="Wartet" />}
                </div>
              ))}
            </div>
            <Button className="w-full rounded-xl py-6 font-display" disabled={state?.status !== "ready" || busy} onClick={() => void reveal()}>
              {state?.status === "ready" ? <><Sparkles className="mr-2 h-5 w-5" /> {busy ? "Auflösung wird geladen …" : "Alle Tipps auflösen"}</> :
                <><ChevronRight className="mr-2 h-5 w-5" /> Warte auf alle Tipps</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
