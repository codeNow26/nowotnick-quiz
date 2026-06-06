import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StartScreenProps {
  title: string;
  subtitle: string;
  maxCategories: number;
  onStart: (playerNames: string[], categoryCount: number) => void;
}

export function StartScreen({ title, subtitle, maxCategories, onStart }: StartScreenProps) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const defaultCats = Math.min(6, maxCategories);
  const [catCount, setCatCount] = useState(defaultCats);

  const updateName = (i: number, v: string) => {
    const next = [...names];
    next[i] = v;
    setNames(next);
  };

  const handleStart = () => {
    const final = names.slice(0, count).map((n, i) => n.trim() || `Spieler ${i + 1}`);
    onStart(final, Math.min(catCount, maxCategories));
  };

  const catOptions = Array.from({ length: maxCategories }, (_, i) => i + 1);

  const pillBase =
    "rounded-xl font-display transition-all duration-200 border";
  const pillIdle =
    "glass text-foreground/80 hover:text-foreground hover:bg-white/10";
  const pillActive =
    "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_30px_-5px_var(--indigo-glow)]";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1
          className="font-display text-5xl md:text-7xl text-foreground tracking-tight mb-3 uppercase"
          style={{ textShadow: "0 0 40px oklch(0.55 0.24 278 / 0.6)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-base md:text-lg mb-8 tracking-wide">
            {subtitle}
          </p>
        )}

        <div className="glass-strong rounded-3xl p-6 md:p-8 glow-primary">
          <div className="mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Spieler
            </Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`${pillBase} w-14 h-14 text-2xl ${count === n ? pillActive : pillIdle}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block">
              Anzahl der Kategorien
            </Label>
            <div className="flex flex-wrap gap-2 justify-center">
              {catOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => setCatCount(n)}
                  className={`${pillBase} w-11 h-11 text-base ${catCount === n ? pillActive : pillIdle}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="text-left">
                <Label
                  htmlFor={`p${i}`}
                  className="text-xs text-muted-foreground uppercase tracking-[0.18em]"
                >
                  Spieler {i + 1}
                </Label>
                <Input
                  id={`p${i}`}
                  value={names[i]}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Spieler ${i + 1}`}
                  className="glass border-white/10 text-foreground placeholder:text-muted-foreground/60 mt-1 h-11 rounded-xl"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            className="w-full font-display text-xl md:text-2xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
          >
            Spiel starten
          </Button>
        </div>
      </div>
    </div>
  );
}
