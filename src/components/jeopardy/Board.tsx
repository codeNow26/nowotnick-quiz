import { POINT_VALUES, type Category } from "@/lib/jeopardy-data";

interface BoardProps {
  categories: Category[];
  answered: boolean[][];
  onSelect: (categoryIndex: number, questionIndex: number) => void;
}

export function Board({ categories, answered, onSelect }: BoardProps) {
  const cols = categories.length;
  return (
    <div
      className="grid gap-2 md:gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {categories.map((cat) => (
        <div
          key={cat.name}
          className="glass-strong rounded-2xl font-display text-center text-[10px] sm:text-xs md:text-base p-2 md:p-4 flex items-center justify-center min-h-16 md:min-h-24 uppercase tracking-wider text-foreground"
        >
          {cat.name}
        </div>
      ))}
      {POINT_VALUES.map((value, qIdx) =>
        categories.map((_, cIdx) => {
          const done = answered[cIdx][qIdx];
          return (
            <button
              key={`${cIdx}-${qIdx}`}
              onClick={() => !done && onSelect(cIdx, qIdx)}
              disabled={done}
              className={`min-h-16 md:min-h-24 rounded-2xl font-display text-lg sm:text-2xl md:text-3xl transition-all duration-200 ${
                done
                  ? "glass opacity-30 cursor-not-allowed text-transparent"
                  : "glass text-foreground hover:scale-[1.04] hover:bg-white/15 hover:shadow-[0_0_30px_-5px_var(--indigo-glow)] active:scale-95"
              }`}
            >
              {value}
            </button>
          );
        })
      )}
    </div>
  );
}
