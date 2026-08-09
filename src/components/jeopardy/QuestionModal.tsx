import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { Question } from "@/lib/jeopardy-data";

interface QuestionModalProps {
  open: boolean;
  question: Question | null;
  value: number;
  category: string;
  players: { name: string; score: number }[];
  onResolve: (playerIndex: number | null, correct: boolean) => void;
  onClose: () => void;
}

export function QuestionModal({
  open,
  question,
  value,
  category,
  players,
  onResolve,
  onClose,
}: QuestionModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setRevealed(false);
      setSelectedPlayer(players.length === 1 ? 0 : null);
    }
  }, [open, players.length]);

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl glass-strong rounded-3xl text-foreground p-0 overflow-hidden border-white/15 glow-primary">
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <span className="font-display text-foreground text-sm md:text-base uppercase tracking-[0.2em]">
            {category}
          </span>
          <span
            className="font-display text-2xl md:text-3xl text-primary"
            style={{ textShadow: "0 0 24px oklch(0.55 0.24 278 / 0.8)" }}
          >
            {value}
          </span>
        </div>

        <div className="p-6 md:p-12 min-h-64 flex items-center justify-center text-center">
         <p className="font-display text-2xl md:text-4xl text-foreground uppercase leading-tight whitespace-pre-line">
  {revealed
    ? question.answer
    : question.question.replace(/\s+(?=[A-D]:)/g, "\n")}
</p>
        </div>

        <div className="p-4 md:p-6 space-y-4 border-t border-white/10 bg-white/5">
          {!revealed ? (
            <Button
              onClick={() => setRevealed(true)}
              size="lg"
              className="w-full font-display text-lg md:text-xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
            >
              Antwort zeigen
            </Button>
          ) : (
            <>
              {players.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3 text-center uppercase tracking-[0.2em]">
                    Wer hat geantwortet?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {players.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPlayer(i)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all border ${
                          selectedPlayer === i
                            ? "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_24px_-6px_var(--indigo-glow)]"
                            : "glass text-foreground/80 hover:text-foreground hover:bg-white/10"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onResolve(selectedPlayer, false)}
                  disabled={players.length > 1 && selectedPlayer === null}
                  size="lg"
                  className="font-display text-base md:text-lg py-6 rounded-2xl uppercase tracking-wider border-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="mr-2" /> Falsch
                </Button>
                <Button
                  onClick={() => onResolve(selectedPlayer, true)}
                  disabled={players.length > 1 && selectedPlayer === null}
                  size="lg"
                  className="font-display text-base md:text-lg py-6 rounded-2xl uppercase tracking-wider border-0 bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                >
                  <Check className="mr-2" /> Richtig
                </Button>
              </div>
              <button
                onClick={() => onResolve(null, false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1 uppercase tracking-[0.2em]"
              >
                Überspringen (keine Punkte)
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
