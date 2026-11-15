import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { POINT_VALUES, playerColor, type QuestionResult, type Category } from "@/lib/jeopardy-data";

interface HighlightedQuestion {
  category: number;
  question: number;
}

interface BoardProps {
  selected?: HighlightedQuestion | null;
  sealing?: HighlightedQuestion | null;
  categories: Category[];
  answered: boolean[][];
  results: Record<string, QuestionResult>;
  players: { name: string; color?:string }[];
  onSelect: (
    categoryIndex: number,
    questionIndex: number
  ) => void;
  highlightedQuestion?: HighlightedQuestion | null;
  isRandomizing?: boolean;
}

export function Board({
  selected,
  sealing = null,
  categories,
  answered,
  results,
  players,
  onSelect,
  highlightedQuestion = null,
  isRandomizing = false,
}: BoardProps) {
  const magneticTweens = useRef(new WeakMap<HTMLButtonElement, {
    x: ReturnType<typeof gsap.quickTo>;
    y: ReturnType<typeof gsap.quickTo>;
    rx: ReturnType<typeof gsap.quickTo>;
    ry: ReturnType<typeof gsap.quickTo>;
  }>());

  const onMagneticMove = (event: ReactPointerEvent<HTMLButtonElement>, done: boolean) => {
    if (done || isRandomizing ||
        event.currentTarget.closest(".quiz-game-launching") ||
        !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

    let setters = magneticTweens.current.get(button);
    if (!setters) {
      setters = {
        x: gsap.quickTo(button, "x", { duration: 0.28, ease: "power2.out" }),
        y: gsap.quickTo(button, "y", { duration: 0.28, ease: "power2.out" }),
        rx: gsap.quickTo(button, "rotationX", { duration: 0.30, ease: "power2.out" }),
        ry: gsap.quickTo(button, "rotationY", { duration: 0.30, ease: "power2.out" }),
      };
      magneticTweens.current.set(button, setters);
    }
    button.style.setProperty("--magnet-light-x", `${(dx + 1) * 50}%`);
    button.style.setProperty("--magnet-light-y", `${(dy + 1) * 50}%`);
    setters.x(dx * 1.7);
    setters.y(dy * 1.5 - 1.5);
    setters.rx(-dy * 1.25);
    setters.ry(dx * 1.25);
  };

  const resetMagnet = (button: HTMLButtonElement) => {
    const setters = magneticTweens.current.get(button);
    if (!setters) return;
    // Reuse the same GSAP quickTo tweens, without killing them between hovers.
    setters.x(0);
    setters.y(0);
    setters.rx(0);
    setters.ry(0);
  };

  const cols = categories.length;

  const manyCategories = cols >= 8;
  const veryManyCategories = cols >= 10;

  return (
    <div
      role="region"
      aria-label="Quiz-Spielfeld, bei Bedarf seitlich scrollen"
      tabIndex={0}
      className="quiz-board-viewport overflow-x-auto overscroll-x-contain rounded-2xl p-2 -m-2 focus-visible:outline-2 focus-visible:outline-primary"
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
          style={{ "--entry-delay": `${80 + categoryIndex * 12}ms` } as CSSProperties}
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
              quiz-category-accent absolute inset-x-4 bottom-0
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
          const result = results[`${cIdx}:${qIdx}`];
          const winner = result?.correct && result.playerIndex !== null ? result.playerIndex : undefined;
          const winnerColor = winner !== undefined ? playerColor(winner, players[winner]?.color) : undefined;
          const description = done ? `${cat.name}, ${cat.questions[qIdx]?.value ?? value} Punkte: ${winner !== undefined ? `${players[winner]?.name} richtig` : "bereits gespielt"}. Zum Nachlesen öffnen.` : `${cat.name}, ${cat.questions[qIdx]?.value ?? value} Punkte`;

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
                !isRandomizing &&
                onSelect(cIdx, qIdx)
              }
              onPointerMove={(event) => onMagneticMove(event, done)}
              onPointerLeave={(event) => resetMagnet(event.currentTarget)}
              disabled={isRandomizing}
              data-quiz-cell={`${cIdx}-${qIdx}`}
              data-opening={selected?.category === cIdx && selected.question === qIdx || undefined}
              data-sealing={sealing?.category === cIdx && sealing.question === qIdx || undefined}
              data-review={done || undefined}
              title={description}
              aria-label={description}
              style={{ "--entry-delay": `${130 + qIdx * 42 + cIdx * 10}ms`, ...(winnerColor ? { borderColor: `${winnerColor}65`, boxShadow: `inset 0 -3px 0 ${winnerColor}80`, backgroundImage: `linear-gradient(${winnerColor}06, ${winnerColor}06)` } : {}) } as CSSProperties}
              className={`
                quiz-question-card group ${!done && !isRandomizing ? "quiz-card-active" : ""}
                relative
                overflow-hidden
                min-h-16 md:min-h-24
                rounded-2xl
                border
                font-display
                transition-colors
                duration-200
                ease-out

                ${
                  done
                    ? `
                      border-white/[0.03]
                      bg-white/[0.025]
                      cursor-default
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
                          hover:border-primary/45
                          hover:from-primary/20
                          hover:via-primary/15
                          hover:to-primary/25
                        `
                }
              `}
            >
              {/* The cursor reacts locally; the page background is never animated. */}
              {!done && !isRandomizing && <span aria-hidden="true" className="quiz-magnetic-reflection" />}
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
                  relative z-10 ${!done && !highlighted ? "quiz-point-value" : ""}
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
                        ? "text-foreground/30"
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