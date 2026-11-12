import { POINT_VALUES, type Category } from "@/lib/jeopardy-data";

interface HighlightedQuestion {
  category: number;
  question: number;
}

interface BoardProps {
  categories: Category[];
  answered: boolean[][];
  onSelect: (
    categoryIndex: number,
    questionIndex: number
  ) => void;
  highlightedQuestion?: HighlightedQuestion | null;
  isRandomizing?: boolean;
}

export function Board({
  categories,
  answered,
  onSelect,
  highlightedQuestion = null,
  isRandomizing = false,
}: BoardProps) {
  const cols = categories.length;

  const manyCategories = cols >= 8;
  const veryManyCategories = cols >= 10;

  return (
    <div
      role="region"
      aria-label="Quiz-Spielfeld, bei Bedarf seitlich scrollen"
      tabIndex={0}
      className="overflow-x-auto overscroll-x-contain rounded-2xl p-2 -m-2 focus-visible:outline-2 focus-visible:outline-primary"
    >
    <div
      className={
        veryManyCategories
          ? "grid gap-1.5 md:gap-2"
          : "grid gap-2 md:gap-3"
      }
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(9rem, 1fr))`,
      }}
    >
      {/* Kategorien */}
      {categories.map((cat, categoryIndex) => (
        <div
          key={`${cat.name}-${categoryIndex}`}
          className={`
            quiz-category-card relative overflow-hidden
            rounded-2xl
            ${
              manyCategories
                ? "min-h-20 md:min-h-28"
                : "min-h-16 md:min-h-24"
            }
            ${
              veryManyCategories
                ? "px-1 md:px-2"
                : manyCategories
                  ? "px-1.5 md:px-3"
                  : "px-2 md:px-4"
            }
            flex items-center justify-center
            text-center
            border border-primary/20
            bg-gradient-to-b
            from-primary/10
            via-primary/[0.06]
            to-black/10
            shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
          `}
        >
          {/* dezenter Lichtschein */}
          <div
            className="
              absolute inset-x-4 top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-primary/50
              to-transparent
            "
          />

          <div
            className="
              absolute
              -top-12 left-1/2
              h-24 w-32
              -translate-x-1/2
              rounded-full
              bg-primary/10
              blur-3xl
              pointer-events-none
            "
          />

          <span
            lang="de"
            className="
              relative z-10 block w-full min-w-0
              font-sans font-bold text-base md:text-lg
              text-foreground text-center leading-snug
              whitespace-normal break-normal hyphens-auto
              [overflow-wrap:break-word] py-3
            "
          >
            {cat.name}
          </span>
        </div>
      ))}

      {/* Fragen */}
      {POINT_VALUES.map((value, qIdx) =>
        categories.map((cat, cIdx) => {
          const done = answered[cIdx][qIdx];

          const highlighted =
            highlightedQuestion?.category === cIdx &&
            highlightedQuestion?.question === qIdx;

          const displayValue =
            cat.questions[qIdx]?.value ?? value;

          return (
            <button
              key={`${cIdx}-${qIdx}`}
              type="button"
              onClick={() =>
                !done &&
                !isRandomizing &&
                onSelect(cIdx, qIdx)
              }
              disabled={done || isRandomizing}
              className={`
                quiz-question-card group
                relative
                overflow-hidden
                min-h-16 md:min-h-24
                rounded-2xl
                border
                font-display
                transition-all
                duration-200
                ease-out

                ${
                  done
                    ? `
                      border-white/[0.03]
                      bg-white/[0.025]
                      brightness-50
                      cursor-not-allowed
                    `
                    : highlighted
                      ? `
                        z-20
                        scale-[1.07]
                        border-primary/80
                        bg-gradient-to-br
                        from-primary
                        via-primary/90
                        to-violet-700
                        text-primary-foreground
                        shadow-[0_0_20px_rgba(99,102,241,0.55),0_0_55px_rgba(99,102,241,0.35)]
                      `
                      : isRandomizing
                        ? `
                          border-white/[0.07]
                          bg-gradient-to-br
                          from-white/[0.07]
                          via-primary/[0.06]
                          to-primary/[0.10]
                          text-foreground
                          brightness-75
                          cursor-wait
                        `
                        : `
                          border-white/[0.08]
                          bg-gradient-to-br
                          from-white/[0.08]
                          via-primary/[0.07]
                          to-primary/[0.12]
                          text-foreground
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                          hover:z-10
                          hover:-translate-y-1
                          hover:scale-[1.035]
                          hover:border-primary/45
                          hover:from-primary/20
                          hover:via-primary/15
                          hover:to-primary/25
                          hover:shadow-[0_10px_35px_-12px_rgba(99,102,241,0.75)]
                          active:translate-y-0
                          active:scale-[0.98]
                        `
                }
              `}
            >
              {/* oberer Lichtreflex */}
              {!done && (
                <div
                  className="
                    absolute inset-x-5 top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-white/15
                    to-transparent
                    opacity-70
                    transition-opacity
                    duration-200
                    group-hover:opacity-100
                  "
                />
              )}

              {/* Hover-Glow */}
              {!done && !highlighted && (
                <div
                  className="
                    absolute
                    left-1/2 top-1/2
                    h-20 w-32
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-primary/0
                    blur-2xl
                    transition-all
                    duration-300
                    group-hover:bg-primary/20
                    pointer-events-none
                  "
                />
              )}

              {/* Roulette-Effekt */}
              {highlighted && (
                <>
                  <span
                    className="
                      absolute inset-0
                      rounded-2xl
                      border-2 border-white/60
                      animate-ping
                      pointer-events-none
                    "
                  />

                  <div
                    className="
                      absolute
                      left-1/2 top-1/2
                      h-24 w-32
                      -translate-x-1/2
                      -translate-y-1/2
                      rounded-full
                      bg-white/15
                      blur-2xl
                      pointer-events-none
                    "
                  />
                </>
              )}

              <span
                className={`
                  relative z-10
                  text-xl sm:text-2xl md:text-[2rem]
                  tracking-tight
                  transition-all
                  duration-200

                  ${
                    highlighted
                      ? `
                        text-white
                        scale-110
                        drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]
                      `
                      : done
                        ? "text-transparent"
                        : `
                          text-foreground
                          drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                          group-hover:text-white
                          group-hover:scale-105
                        `
                  }
                `}
              >
                {displayValue}
              </span>

              {/* sehr dezenter unterer Akzent */}
              {!done && !highlighted && (
                <div
                  className="
                    absolute
                    bottom-0 left-1/2
                    h-px w-1/2
                    -translate-x-1/2
                    bg-gradient-to-r
                    from-transparent
                    via-primary/25
                    to-transparent
                    opacity-0
                    transition-opacity
                    duration-200
                    group-hover:opacity-100
                  "
                />
              )}
            </button>
          );
        })
      )}
    </div>
    </div>
  );
}