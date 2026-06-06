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
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl bg-jeopardy-blue border-4 border-primary text-foreground p-0 overflow-hidden"
      >
        <div className="bg-jeopardy-blue-dark px-6 py-3 flex justify-between items-center">
          <span className="font-display text-primary text-sm md:text-lg uppercase tracking-wider">
            {category}
          </span>
          <span className="font-display text-primary text-shadow-gold text-2xl md:text-3xl">
            ${value}
          </span>
        </div>

        <div className="p-6 md:p-12 min-h-64 flex items-center justify-center text-center">
          <p className="font-display text-2xl md:text-4xl text-foreground uppercase leading-tight">
            {revealed ? question.answer : question.question}
          </p>
        </div>

        <div className="bg-jeopardy-blue-dark p-4 md:p-6 space-y-4">
          {!revealed ? (
            <Button
              onClick={() => setRevealed(true)}
              size="lg"
              className="w-full font-display text-xl py-6 bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider"
            >
              SHOW ANSWER
            </Button>
          ) : (
            <>
              {players.length > 1 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 text-center">
                    Who answered?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {players.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPlayer(i)}
                        className={`px-4 py-2 rounded-md font-semibold transition-all ${
                          selectedPlayer === i
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
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
                  variant="destructive"
                  size="lg"
                  className="font-display text-lg py-6"
                >
                  <X className="mr-2" /> WRONG
                </Button>
                <Button
                  onClick={() => onResolve(selectedPlayer, true)}
                  disabled={players.length > 1 && selectedPlayer === null}
                  size="lg"
                  className="font-display text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="mr-2" /> CORRECT
                </Button>
              </div>
              <button
                onClick={() => onResolve(null, false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Skip (no points)
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
