import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectionTrack } from "./SelectionTrack";
import { CheckCircle2, Copy, Smartphone } from "lucide-react";
import type { BonusPlayer, BonusSession } from "@/lib/bonus-pass-api";

import { PLAYER_PALETTE, normalizeColors, readPlayerPreferences, rememberPlayers, selectPlayerColor } from "@/lib/player-preferences";

const departureMs = 180;

interface StartScreenProps {
  title: string;
  subtitle: string;
  maxCategories: number;
  selectedCategoryCount?: number;
  onCategoryCountChange?: (count:number)=>void;
  activeQuiz?: number;
  footer?: ReactNode;
  onQuizChange: (quiz: 1 | 2 | 3 | 4) => void;
  onStart: (playerNames: string[], categoryCount: number, colors:string[]) => void;
  onPrepareBonus?: (players: BonusPlayer[]) => Promise<void>;
  preparedBonus?: { session: BonusSession; roster: string } | null;
}

export function StartScreen({
  title,
  subtitle,
  maxCategories, selectedCategoryCount, onCategoryCountChange,
  activeQuiz,
  footer,
  onQuizChange,
  onStart,
  onPrepareBonus,
  preparedBonus,
}: StartScreenProps) {
  const [launching, setLaunching] = useState(false);
  const [preparingPhone, setPreparingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (launchTimer.current) clearTimeout(launchTimer.current); }, []);
  const [count, setCount] = useState(2);
  const playerFieldsRef = useRef<HTMLDivElement>(null);
  const priorCount = useRef(count);
  const pendingPlayerHeight = useRef<number | null>(null);

  const changePlayerCount = (nextCount: number) => {
    if (nextCount === count) return;
    const fields = playerFieldsRef.current;
    pendingPlayerHeight.current = fields?.getBoundingClientRect().height ?? null;
    // The gliding selection can update immediately while fields follow
    // in a coordinated, height-based transition.
    setColorPicker(null);
    setCount(nextCount);
    rememberPlayers({ names, colors, count: nextCount });
  };

  useLayoutEffect(() => {
    const oldCount = priorCount.current;
    priorCount.current = count;
    const fields = playerFieldsRef.current;
    const fromHeight = pendingPlayerHeight.current;
    pendingPlayerHeight.current = null;
    // First mount / stored preferences should never start an animation.
    if (!fields || fromHeight === null || oldCount === count) return;

    gsap.killTweensOf(fields);
    gsap.set(fields, { height: "auto", overflow: "visible" });
    const toHeight = fields.getBoundingClientRect().height;
    const shouldAnimate = Math.abs(fromHeight - toHeight) > 1 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldAnimate) {
      gsap.set(fields, { clearProps: "height,overflow" });
      return;
    }

    gsap.fromTo(fields,
      { height: fromHeight, overflow: "hidden" },
      {
        height: toHeight, duration: 0.46, ease: "power3.inOut",
        onComplete: () => gsap.set(fields, { clearProps: "height,overflow" }),
      }
    );
    if (count > oldCount) {
      const rows = Array.from(fields.querySelectorAll<HTMLElement>(".quiz-player-entry"))
        .slice(oldCount);
      gsap.fromTo(rows, { autoAlpha: 0, y: 11 },
        { autoAlpha: 1, y: 0, duration: 0.34, delay: 0.10,
          stagger: 0.055, ease: "power3.out", overwrite: "auto" });
    }
  }, [count]);

  useEffect(() => {
    const fields = playerFieldsRef.current;
    return () => {
      if (fields) {
        gsap.killTweensOf(fields);
        gsap.killTweensOf(fields.querySelectorAll(".quiz-player-entry"));
      }
    };
  }, []);
  const [names, setNames] = useState<string[]>(["", "", "", "", "", ""]);
  const [colors,setColors]=useState<string[]>(["", "", "", "", "", ""]);
  const [colorPicker,setColorPicker]=useState<number|null>(null);
  useEffect(()=>{const prefs=readPlayerPreferences();setNames(prefs.names);setColors(prefs.colors);setCount(prefs.count);},[]);
  const chooseColor=(index:number,color:string)=>{const next=selectPlayerColor(colors,index,color,count);setColors(next);rememberPlayers({names,colors:next,count});setColorPicker(null);};
  const defaultCats = Math.min(6, maxCategories);
  const [localCatCount, setLocalCatCount] = useState(defaultCats);
  const catCount = Math.min(selectedCategoryCount ?? localCatCount,maxCategories);
  const setCatCount=(count:number)=>{setLocalCatCount(count);onCategoryCountChange?.(count);};

  const updateName = (i: number, v: string) => {
    const next = [...names];
    next[i] = v;
    setNames(next);
    rememberPlayers({names:next,colors,count});
  };

  const activePlayers: BonusPlayer[] = names.slice(0, count).map((name, i) => ({
    name: name.trim() || `Spieler ${i + 1}`,
    color: normalizeColors(colors.slice(0, count))[i],
  }));
  const phoneConnected = !!preparedBonus && preparedBonus.roster === JSON.stringify(activePlayers);
  const preparePhone = async () => {
    if (!onPrepareBonus || preparingPhone) return;
    setPreparingPhone(true);
    setPhoneError("");
    setCopiedPhone(false);
    try { await onPrepareBonus(activePlayers); }
    catch (e) { setPhoneError(e instanceof Error ? e.message : "Handy-Verbindung fehlgeschlagen."); }
    finally { setPreparingPhone(false); }
  };
  const phoneLink = typeof window === "undefined" || !phoneConnected
    ? "" : `${window.location.origin}/mitraten/${preparedBonus!.session.code}`;

  const handleStart = () => {
    if (launchTimer.current || launching) return;
    const final = names
      .slice(0, count)
      .map((n, i) => n.trim() || `Spieler ${i + 1}`);

    rememberPlayers({names,colors,count});
    const gameColors = normalizeColors(colors.slice(0,count)).slice(0,count);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onStart(final, Math.min(catCount, maxCategories), gameColors);
      return;
    }
    setLaunching(true);
    launchTimer.current = setTimeout(() => onStart(final, Math.min(catCount, maxCategories), gameColors), departureMs);
  };

  const catOptions = Array.from(
    { length: maxCategories },
    (_, i) => i + 1
  );

  const pillBase =
    "quiz-selection relative z-10 rounded-xl font-display transition-colors duration-200 border";

  const pillIdle =
    "glass text-foreground/80 hover:text-foreground hover:bg-white/10";

  const pillActive =
    "quiz-selection-active text-primary-foreground border-white/25";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-8">
      <div className={`w-full max-w-2xl text-center ${launching ? "quiz-start-depart" : ""}`} style={launching ? { animationDuration: `${departureMs}ms` } : undefined} inert={launching || undefined}>
        <div className="quiz-entry-title">
        <h1
          className="quiz-title font-display text-5xl md:text-7xl text-foreground tracking-tight mb-3 uppercase"
          style={{
            textShadow:
              "0 0 40px oklch(0.55 0.24 278 / 0.6)",
          }}
        >
          {title}
        </h1>
        </div>

        {subtitle && (
          <p className="quiz-entry-subtitle text-muted-foreground text-base md:text-lg mb-8 tracking-wide">
            {subtitle}
          </p>
        )}

        <div className="quiz-entry-panel glass-strong rounded-3xl p-6 md:p-8 glow-primary">

          {/* QUIZ AUSWAHL */}

          {activeQuiz !== undefined && <div className="quiz-entry-step mb-7">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Quiz auswählen
            </Label>

            <SelectionTrack value={activeQuiz} className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([1, 2, 3, 4] as const).map((quiz) => (
                <button
                  data-selection-value={quiz}
                  key={quiz}
                  aria-pressed={activeQuiz === quiz}
                  onClick={() => onQuizChange(quiz)}
                  className={`${pillBase} h-12 text-sm ${
                    activeQuiz === quiz
                      ? pillActive
                      : pillIdle
                  }`}
                >
                  Quiz {quiz}
                </button>
              ))}
            </SelectionTrack>
          </div>}

          {/* SPIELERANZAHL */}

          <div className="quiz-entry-step mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Spieler
            </Label>

            <SelectionTrack value={count} className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  data-selection-value={n}
                  key={n}
                  aria-pressed={count === n}
                  onClick={() => changePlayerCount(n)}
                  className={`${pillBase} w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl ${
                    count === n
                      ? pillActive
                      : pillIdle
                  }`}
                >
                  {n}
                </button>
              ))}
            </SelectionTrack>
          </div>

          {/* KATEGORIEN */}

          <div className="quiz-entry-step mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Kategorien
            </Label>

            <SelectionTrack value={catCount} className="flex flex-wrap gap-2 justify-center">
              {catOptions.map((n) => (
                <button
                  data-selection-value={n}
                  key={n}
                  aria-pressed={catCount === n}
                  onClick={() => setCatCount(n)}
                  className={`${pillBase} w-11 h-11 text-base ${
                    catCount === n
                      ? pillActive
                      : pillIdle
                  }`}
                >
                  {n}
                </button>
              ))}
            </SelectionTrack>
          </div>

          {/* SPIELERNAMEN */}

          <div ref={playerFieldsRef} className="quiz-entry-step space-y-3 mb-8">
            {Array.from({ length: count }).map(
              (_, i) => (
                <div key={i} className="quiz-player-entry text-left">
                  <Label
                    htmlFor={`p${i}`}
                    className="text-xs text-muted-foreground uppercase tracking-[0.18em]"
                  >
                    Spieler {i + 1}
                  </Label>

                  <div className="flex items-center gap-3 mt-1">
                  <button type="button" className="shrink-0 h-11 w-11 rounded-xl border border-white/25 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Farbe für Spieler ${i+1}: ${PLAYER_PALETTE.find(p=>p.color===colors[i])?.name ?? 'Nicht ausgewählt'}`} aria-expanded={colorPicker===i} onClick={()=>setColorPicker(colorPicker===i?null:i)}>
                    <span className={`h-6 w-6 rounded-full border border-white/40 ${colors[i] ? "quiz-color-gem" : "border-dashed"}`} style={colors[i] ? {backgroundColor:colors[i]} : undefined} />
                  </button>
                  <Input
                    id={`p${i}`}
                    value={names[i]}
                    onChange={(e) =>
                      updateName(i, e.target.value)
                    }
                    placeholder={`Spieler ${i + 1}`}
                    className="glass border-white/10 text-foreground placeholder:text-muted-foreground/60 h-11 rounded-xl min-w-0"
                  />
                  </div>
                  {colorPicker===i && <fieldset className="mt-3 rounded-xl border border-white/10 bg-background/70 p-3"><legend className="px-1 text-xs text-muted-foreground">Farbe auswählen · belegte Farben sind gesperrt</legend>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">{PLAYER_PALETTE.map(p=>{const used=colors.some((c,j)=>j!==i&&j<count&&c===p.color);return <button key={p.color} type="button" disabled={used} aria-label={`${p.name}${used?' (bereits vergeben)':''}`} aria-pressed={colors[i]===p.color} title={p.name} onClick={()=>chooseColor(i,p.color)} className="flex flex-col items-center gap-1 rounded-lg p-1.5 border border-transparent aria-pressed:border-white/70 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary">
                      <span className="quiz-color-gem h-7 w-7 rounded-full border border-white/30 flex items-center justify-center text-slate-950 text-sm font-bold" style={{backgroundColor:p.color}}>{used?'×':colors[i]===p.color?'✓':''}</span><span className="text-[10px]">{p.name}</span>
                    </button>;})}</div>
                  </fieldset>}
                </div>
              )
            )}
          </div>

          {onPrepareBonus && (
            <div className="mb-6 rounded-2xl border border-white/[.10] bg-white/[.025] px-4 py-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">Handy für Schätzrunden</p>
                    <p className="text-xs text-muted-foreground">Einmal vorab verbinden, danach bleibt es bereit.</p>
                  </div>
                </div>
                {phoneConnected
                  ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Verbindung vorbereitet</span>
                  : <Button type="button" variant="outline" disabled={preparingPhone || launching}
                      onClick={() => void preparePhone()} className="rounded-xl border-primary/35">
                      {preparingPhone ? "Verbindung wird erstellt …" : "Handy vorbereiten"}
                    </Button>}
              </div>
              {phoneConnected && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/[.06] px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Verbindungscode</p>
                    <p className="font-mono text-xl font-semibold tracking-[.12em]">{preparedBonus!.session.code}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{phoneLink}</p>
                  </div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={async () => {
                    try { await navigator.clipboard.writeText(phoneLink); setCopiedPhone(true); }
                    catch { setPhoneError("Link konnte nicht kopiert werden. Bitte den Code am Handy eingeben."); }
                  }}>
                    {copiedPhone ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copiedPhone ? "Kopiert" : "Link kopieren"}
                  </Button>
                </div>
              )}
              {!phoneConnected && preparedBonus && (
                <p className="mt-2 text-xs text-amber-200">Spieler geändert. Das Handy bitte erneut vorbereiten.</p>
              )}
              {phoneError && <p role="alert" className="mt-2 text-sm text-rose-300">{phoneError}</p>}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={launching}
            size="lg"
            className="quiz-entry-cta quiz-action w-full font-display text-xl md:text-2xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
          >
            Spiel starten
          </Button>
        </div>
        <div className="quiz-entry-footer">{footer}</div>
      </div>
    </div>
  );
}