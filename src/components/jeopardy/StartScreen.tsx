import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PLAYER_PALETTE, DEFAULT_PLAYER_COLORS, readPlayerPreferences, rememberPlayers, selectPlayerColor } from "@/lib/player-preferences";

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
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [colors,setColors]=useState<string[]>([...DEFAULT_PLAYER_COLORS]);
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
    const final = names
      .slice(0, count)
      .map((n, i) => n.trim() || `Spieler ${i + 1}`);

    rememberPlayers({names,colors,count});
    onStart(final, Math.min(catCount, maxCategories), colors.slice(0,count));
  };

  const catOptions = Array.from(
    { length: maxCategories },
    (_, i) => i + 1
  );

  const pillBase =
    "quiz-selection rounded-xl font-display transition-all duration-200 border";

  const pillIdle =
    "glass text-foreground/80 hover:text-foreground hover:bg-white/10";

  const pillActive =
    "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_30px_-5px_var(--indigo-glow)]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-8">
      <div className="w-full max-w-2xl text-center">
        <h1
          className="quiz-title font-display text-5xl md:text-7xl text-foreground tracking-tight mb-3 uppercase"
          style={{
            textShadow:
              "0 0 40px oklch(0.55 0.24 278 / 0.6)",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-muted-foreground text-base md:text-lg mb-8 tracking-wide">
            {subtitle}
          </p>
        )}

        <div className="glass-strong rounded-3xl p-6 md:p-8 glow-primary">

          {/* QUIZ AUSWAHL */}

          {activeQuiz !== undefined && <div className="mb-7">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Quiz auswählen
            </Label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([1, 2, 3, 4] as const).map((quiz) => (
                <button
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
            </div>
          </div>}

          {/* SPIELERANZAHL */}

          <div className="mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Spieler
            </Label>

            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  aria-pressed={count === n}
                  onClick={() => {setCount(n);rememberPlayers({names,colors,count:n});}}
                  className={`${pillBase} w-14 h-14 text-2xl ${
                    count === n
                      ? pillActive
                      : pillIdle
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* KATEGORIEN */}

          <div className="mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Kategorien
            </Label>

            <div className="flex flex-wrap gap-2 justify-center">
              {catOptions.map((n) => (
                <button
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
            </div>
          </div>

          {/* SPIELERNAMEN */}

          <div className="space-y-3 mb-8">
            {Array.from({ length: count }).map(
              (_, i) => (
                <div key={i} className="text-left">
                  <Label
                    htmlFor={`p${i}`}
                    className="text-xs text-muted-foreground uppercase tracking-[0.18em]"
                  >
                    Spieler {i + 1}
                  </Label>

                  <div className="flex items-center gap-3 mt-1">
                  <button type="button" className="shrink-0 h-11 w-11 rounded-xl border border-white/25 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Farbe für Spieler ${i+1}: ${PLAYER_PALETTE.find(p=>p.color===colors[i])?.name}`} aria-expanded={colorPicker===i} onClick={()=>setColorPicker(colorPicker===i?null:i)}>
                    <span className="h-6 w-6 rounded-full border border-white/40" style={{backgroundColor:colors[i]}} />
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
                      <span className="h-7 w-7 rounded-full border border-white/30 flex items-center justify-center text-slate-950 text-sm font-bold" style={{backgroundColor:p.color}}>{used?'×':colors[i]===p.color?'✓':''}</span><span className="text-[10px]">{p.name}</span>
                    </button>;})}</div>
                  </fieldset>}
                </div>
              )
            )}
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            className="quiz-action w-full font-display text-xl md:text-2xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
          >
            Spiel starten
          </Button>
        </div>
        {footer}
      </div>
    </div>
  );
}