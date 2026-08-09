import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StartScreen } from "@/components/jeopardy/StartScreen";
import { Board } from "@/components/jeopardy/Board";
import { QuestionModal } from "@/components/jeopardy/QuestionModal";
import { ScoreBoard } from "@/components/jeopardy/ScoreBoard";
import { Editor } from "@/components/jeopardy/Editor";
import { Button } from "@/components/ui/button";
import { Music, VolumeX, Pencil } from "lucide-react";
import { POINT_VALUES } from "@/lib/jeopardy-data";
import { useCategories } from "@/lib/use-categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Familienquiz — Quizspiel" },
      { name: "description", content: "Spielt ein Quiz im Jeopardy-Stil mit 1–4 Spielern und bis zu 10 Kategorien." },
      { property: "og:title", content: "Familienquiz — Quizspiel" },
      { property: "og:description", content: "Spielt ein Quiz im Jeopardy-Stil mit 1–4 Spielern und bis zu 10 Kategorien." },
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

type Screen = "start" | "game" | "editor";

function makeAnswered(categoryCount: number, questionCount: number) {
  return Array.from({ length: categoryCount }, () =>
    Array.from({ length: questionCount }, () => false)
  );
}

function Index() {
  const { categories: allCategories, save, meta, saveMeta, reset } = useCategories();
  const audioRef = useRef<HTMLAudioElement | null>(null);
const [musicPlaying, setMusicPlaying] = useState(false);

const toggleMusic = () => {
  if (!audioRef.current) {
    audioRef.current = new Audio("/music/background.mp3");
    audioRef.current.loop = true;
  }

  if (musicPlaying) {
    audioRef.current.pause();
    setMusicPlaying(false);
  } else {
    audioRef.current.play();
    setMusicPlaying(true);
  }
};

  const [screen, setScreen] = useState<Screen>("start");
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeCategoryCount, setActiveCategoryCount] = useState(
    Math.min(6, allCategories.length)
  );
  const categories = useMemo(
    () => allCategories.slice(0, activeCategoryCount),
    [allCategories, activeCategoryCount]
  );
  const [answered, setAnswered] = useState<boolean[][]>(() =>
    makeAnswered(activeCategoryCount, POINT_VALUES.length)
  );
  const [active, setActive] = useState<Active | null>(null);

  const allAnswered = useMemo(
    () => answered.every((row) => row.every(Boolean)),
    [answered]
  );

  if (screen === "editor") {
    return (
      <Editor
        initial={allCategories}
        initialMeta={meta}
        onSave={save}
        onSaveMeta={saveMeta}
        onReset={reset}
        onBack={() => setScreen("start")}
      />
    );
  }

 if (screen === "start") {
  return (
    <div className="relative">
      <StartScreen
        title={meta.title}
        subtitle={meta.subtitle}
        maxCategories={allCategories.length}
        onStart={(names, catCount) => {
          setPlayers(names.map((name) => ({ name, score: 0 })));
          setActiveCategoryCount(catCount);
          setAnswered(makeAnswered(catCount, POINT_VALUES.length));
          setScreen("game");
        }}
      />

      <div className="fixed top-4 right-4 flex gap-2">
       <Button
  variant="outline"
  size="icon"
  onClick={toggleMusic}
  className={`h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${
    musicPlaying
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
      : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"
  }`}
  title={musicPlaying ? "Musik ausschalten" : "Musik einschalten"}
>
  {musicPlaying ? (
    <VolumeX className="h-5 w-5" />
  ) : (
    <Music className="h-5 w-5" />
  )}
</Button>

        <Button
          variant="outline"
          onClick={() => setScreen("editor")}
          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Fragen bearbeiten
        </Button>
      </div>
    </div>
  );
}

  const activeQuestion =
    active !== null ? categories[active.category].questions[active.question] : null;
  const activeValue =
  active !== null
    ? categories[active.category].questions[active.question].value ??
      POINT_VALUES[active.question]
    : 0;
  const activeCategory = active !== null ? categories[active.category].name : "";

  const handleResolve = (playerIndex: number | null, correct: boolean) => {
    if (!active) return;
    const sound = new Audio(
  correct ? "/sounds/correct.mp3" : "/sounds/wrong.mp3"
);
sound.volume = 0.50;
sound.play();
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

<div className="fixed top-4 right-4 z-50">
  <Button
    variant="outline"
    size="icon"
    onClick={toggleMusic}
    className={`h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${
      musicPlaying
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
        : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"
    }`}
    title={musicPlaying ? "Musik ausschalten" : "Musik einschalten"}
  >
    {musicPlaying ? (
      <VolumeX className="h-5 w-5" />
    ) : (
      <Music className="h-5 w-5" />
    )}
  </Button>
</div>


      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1
          className="font-display text-3xl md:text-5xl text-foreground tracking-tight uppercase"
          style={{ textShadow: "0 0 30px oklch(0.55 0.24 278 / 0.6)" }}
        >
          {meta.title}
        </h1>
        <Button
          onClick={() => setScreen("start")}
          className="glass text-foreground hover:bg-white/15 border-white/15 rounded-xl"
        >
          Neues Spiel
        </Button>
      </header>

      <div className="mb-4 md:mb-6">
        <ScoreBoard players={players} />
      </div>

      {winner && (
        <div className="mb-4 md:mb-6 glass-strong rounded-3xl p-4 md:p-6 text-center glow-primary animate-in fade-in zoom-in">
          <p className="font-display text-2xl md:text-4xl uppercase text-foreground tracking-wide">
            🏆 {winner.name} gewinnt mit {winner.score}!
          </p>
        </div>
      )}

      <Board
        categories={categories}
        answered={answered}
        onSelect={(category, question) => setActive({ category, question })}
      />

      <div className="mt-4 md:mt-6">
        <ScoreBoard players={players} />
      </div>

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
