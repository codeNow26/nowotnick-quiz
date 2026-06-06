import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StartScreenProps {
  onStart: (playerNames: string[]) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);

  const updateName = (i: number, v: string) => {
    const next = [...names];
    next[i] = v;
    setNames(next);
  };

  const handleStart = () => {
    const final = names.slice(0, count).map((n, i) => n.trim() || `Player ${i + 1}`);
    onStart(final);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-display text-6xl md:text-8xl text-primary text-shadow-gold tracking-wider mb-3">
          JEOPARDY!
        </h1>
        <p className="text-muted-foreground text-lg mb-10">The classic quiz game, your way.</p>

        <div className="bg-card/80 backdrop-blur rounded-2xl p-6 md:p-8 border-2 border-primary/40 shadow-2xl">
          <div className="mb-6">
            <Label className="text-foreground text-base mb-3 block">Number of players</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-14 h-14 rounded-lg font-display text-2xl transition-all ${
                    count === n
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="text-left">
                <Label htmlFor={`p${i}`} className="text-sm text-muted-foreground">
                  Player {i + 1}
                </Label>
                <Input
                  id={`p${i}`}
                  value={names[i]}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="bg-input border-border text-foreground"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            className="w-full font-display text-2xl py-6 bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider"
          >
            START GAME
          </Button>
        </div>
      </div>
    </div>
  );
}
