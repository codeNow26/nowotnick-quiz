import { POINT_VALUES, type Category } from "@/lib/jeopardy-data";

interface BoardProps {
  categories: Category[];
  answered: boolean[][]; // [category][questionIndex]
  onSelect: (categoryIndex: number, questionIndex: number) => void;
}

export function Board({ categories, answered, onSelect }: BoardProps) {
  const cols = categories.length;
  return (
    <div
      className="grid gap-1.5 md:gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {categories.map((cat) => (
        <div
          key={cat.name}
          className="bg-jeopardy-blue-dark text-primary font-display text-center text-xs sm:text-sm md:text-lg p-2 md:p-4 rounded-md tile-shadow flex items-center justify-center min-h-16 md:min-h-24 uppercase tracking-wide"
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
              className={`min-h-16 md:min-h-24 rounded-md font-display text-xl sm:text-2xl md:text-4xl transition-all tile-shadow ${
                done
                  ? "bg-jeopardy-blue-dark/40 text-transparent cursor-not-allowed"
                  : "bg-jeopardy-blue text-primary text-shadow-gold hover:scale-105 hover:bg-jeopardy-blue/80 active:scale-95"
              }`}
            >
              ${value}
            </button>
          );
        })
      )}
    </div>
  );
}
