import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectionTrack } from "./SelectionTrack";

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
}

export function StartScreen({
  title,
  subtitle,
  maxCategories, selectedCategoryCount, onCategoryCountChange,
  activeQuiz,
  footer,
  onQuizChange,
  onStart,
}: StartScreenProps) {
  const [launching, setLaunching] = useState(false);
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