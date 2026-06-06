import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StartScreen } from "@/components/jeopardy/StartScreen";
import { Board } from "@/components/jeopardy/Board";
import { QuestionModal } from "@/components/jeopardy/QuestionModal";
import { ScoreBoard } from "@/components/jeopardy/ScoreBoard";
import { Button } from "@/components/ui/button";
import { CATEGORIES, POINT_VALUES } from "@/lib/jeopardy-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jeopardy! — Quiz Game" },
      { name: "description", content: "Play a Jeopardy-style quiz with 1–4 players across 6 categories." },
      { property: "og:title", content: "Jeopardy! — Quiz Game" },
      { property: "og:description", content: "Play a Jeopardy-style quiz with 1–4 players across 6 categories." },
    ],
  }),
  component: Index,
});

interface Player {
  name: string;
  score: number;
}

interface Active {
  category: number;
  question: number;
}

function makeAnswered() {
  return CATEGORIES.map(() => POINT_VALUES.map(() => false));
}

function Index() {
  const [started, setStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answered, setAnswered] = useState<boolean[][]>(makeAnswered());
  const [active, setActive] = useState<Active | null>(null);

  const allAnswered = useMemo(
    () => answered.every((row) => row.every(Boolean)),
    [answered]
  );

  if (!started) {
    return (
      <StartScreen
        onStart={(names) => {
          setPlayers(names.map((name) => ({ name, score: 0 })));
          setAnswered(makeAnswered());
          setStarted(true);
        }}
      />
    );
  }

  const activeQuestion =
    active !== null ? CATEGORIES[active.category].questions[active.question] : null;
  const activeValue = active !== null ? POINT_VALUES[active.question] : 0;
  const activeCategory = active !== null ? CATEGORIES[active.category].name : "";

  const handleResolve = (playerIndex: number | null, correct: boolean) => {
    if (!active) return;
    if (playerIndex !== null) {
      setPlayers((prev) =>
        prev.map((p, i) =>
          i === playerIndex
            ? { ...p, score: p.score + (correct ? activeValue : -activeValue) }
            : p
        )
      );
    }
    setAnswered((prev) => {
      const next = prev.map((row) => [...row]);
      next[active.category][active.question] = true;
      return next;
    });
    setActive(null);
  };

  const winner = allAnswered
    ? [...players].sort((a, b) => b.score - a.score)[0]
    : null;

  return (
    <div className="min-h-screen p-3 md:p-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="font-display text-3xl md:text-5xl text-primary text-shadow-gold tracking-wider">
          JEOPARDY!
        </h1>
        <Button
          variant="outline"
          onClick={() => setStarted(false)}
          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          New Game
        </Button>
      </header>

      <div className="mb-4 md:mb-6">
        <ScoreBoard players={players} />
      </div>

      {winner && (
        <div className="mb-4 md:mb-6 bg-primary text-primary-foreground rounded-xl p-4 md:p-6 text-center shadow-2xl animate-in fade-in zoom-in">
          <p className="font-display text-2xl md:text-4xl">
            🏆 {winner.name} WINS WITH ${winner.score}!
          </p>
        </div>
      )}

      <Board
        answered={answered}
        onSelect={(category, question) => setActive({ category, question })}
      />

      <QuestionModal
        open={active !== null}
        question={activeQuestion}
        value={activeValue}
        category={activeCategory}
        players={players}
        onResolve={handleResolve}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
