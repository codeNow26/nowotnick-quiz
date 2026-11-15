import { playerColor } from "@/lib/jeopardy-data";
import { useEffect, useLayoutEffect, useState, useRef, type CSSProperties } from "react";
import { Check, Crown, Pencil, X } from "lucide-react";
interface Player {
  color?: string;
  name: string;
  score: number;
}
export interface ScorePopup {
  id: number;
  playerIndex: number;
  amount: number;
}
interface ScoreBoardProps {
  players: Player[];
  scorePopups?: ScorePopup[];
  onScoreChange?: (
    playerIndex: number,
    newScore: number
  ) => void;
}
function AnimatedScore({ score }: { score: number }) {
  const number = useRef<HTMLSpanElement>(null);
  const displayed = useRef(score);
  useLayoutEffect(() => {
    const node = number.current;
    if (!node) return;
    const from = displayed.current;
    const paint = (value: number) => {
      displayed.current = value;
      node.textContent = String(value);
    };
    if (from === score || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(score);
      return;
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 540);
      paint(Math.round(from + (score - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  return <><span aria-hidden="true" className="tabular-nums" ref={number} /><span className="sr-only">{score}</span></>;
}
function ScoreFlash({score}: {score:number}) {
  const previous = useRef(score);
  const [version,setVersion] = useState(0);
  useEffect(() => {
    if(previous.current !== score) { previous.current=score; setVersion(v=>v+1); }
  },[score]);
  return version ? <span key={version} aria-hidden="true" className="quiz-score-flash" /> : null;
}
export function ScoreBoard({
  players,
  scorePopups = [],
  onScoreChange,
}: ScoreBoardProps) {
  const [editingPlayer, setEditingPlayer] =
    useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const highestScore =
    players.length > 0
      ? Math.max(...players.map((p) => p.score))
      : 0;
  const leaders = players.filter(
    (p) => p.score === highestScore
  );
  const hasSingleLeader = leaders.length === 1;
  useEffect(() => {
    if (
      editingPlayer !== null &&
      !players[editingPlayer]
    ) {
      setEditingPlayer(null);
      setEditValue("");
    }
  }, [players, editingPlayer]);
  const grid = useRef<HTMLDivElement>(null);
  const crown = useRef<HTMLDivElement>(null);
  const lastSoleLeader = useRef<number | null>(null);
  const leader = hasSingleLeader ? players.findIndex(p => p.score === highestScore) : null;
  useLayoutEffect(() => {
    if (leader === null) return;
    const previous = lastSoleLeader.current;
    lastSoleLeader.current = leader;
    const badge = crown.current;
    if (!badge || previous === null || previous === leader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const source = grid.current?.children[previous]?.getBoundingClientRect();
    const dest = badge.getBoundingClientRect();
    if (!source) return;
    const dx = source.left + source.width / 2 - (dest.left + dest.width / 2);
    const dy = source.top - dest.top - 12;
    badge.style.setProperty('--trail-angle', `${Math.atan2(-dy, -dx)}rad`);
    badge.classList.add('quiz-flying-crown');
    const flight = badge.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 20}px)`, offset: .48 },
      { transform: 'translate(0,0)' },
    ], { duration: 600, easing: 'cubic-bezier(.32,0,.2,1)' });
    return () => { flight.cancel(); badge.classList.remove('quiz-flying-crown'); };
  }, [leader]);
  const startEditing = (playerIndex: number) => {
    if (!onScoreChange) return;
    setEditingPlayer(playerIndex);
    setEditValue(String(players[playerIndex].score));
  };
  const cancelEditing = () => {
    setEditingPlayer(null);
    setEditValue("");
  };
  const saveScore = (playerIndex: number) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue === "") {
      return;
    }
    const newScore = Number(trimmedValue);
    if (!Number.isFinite(newScore)) {
      return;
    }
    onScoreChange?.(
      playerIndex,
      Math.round(newScore)
    );
    setEditingPlayer(null);
    setEditValue("");
  };
  return (
    <div ref={grid} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {players.map((p, i) => {
        const isLeader =
          hasSingleLeader &&
          p.score === highestScore;
        const playerPopups = scorePopups.filter(
          (popup) => popup.playerIndex === i
        );
        const isEditing = editingPlayer === i;
        return (
          <div
            key={i}
            data-leading={isLeader || undefined}
            style={{"--entry-delay": `${i * 35}ms`, "--player-color": playerColor(i,p.color)} as CSSProperties}
            className={`
              quiz-player-card group/player
              relative
              overflow-visible
              rounded-2xl
              px-3 py-3
              md:px-4 md:py-4
              text-center
              border
              transition-all
              duration-300
              ${
                isLeader
                  ? `
                    border-amber-400/35
                    bg-gradient-to-br
                    from-amber-400/[0.10]
                    via-primary/[0.13]
                    to-primary/[0.18]
                    shadow-[0_0_30px_-10px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]
                    scale-[1.025]
                  `
                  : `
                    border-white/[0.08]
                    bg-gradient-to-br
                    from-white/[0.07]
                    via-primary/[0.09]
                    to-primary/[0.14]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                  `
              }
            `}
          >
            {/* Hintergrund-Glow */}
            <div
              className={`
                absolute
                left-1/2 top-1/2
                -translate-x-1/2
                -translate-y-1/2
                h-20 w-40
                rounded-full
                blur-3xl
                pointer-events-none
                ${
                  isLeader
                    ? "bg-amber-400/[0.08]"
                    : "bg-primary/[0.08]"
                }
              `}
            />
            <span aria-hidden="true" className="quiz-player-stripe" />
            <ScoreFlash score={p.score} />
            {/* Führungskrone */}
            {isLeader && (
              <div
                ref={crown}
                className="
                  absolute
                  -top-3
                  left-1/2
                  -translate-x-1/2
                  z-20
                  h-7 w-7
                  rounded-full
                  flex items-center justify-center
                  border border-amber-300/40
                  bg-background
                  shadow-[0_0_16px_rgba(251,191,36,0.35)]
                "
                title="Aktuell in Führung"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              </div>
            )}
            {/* Punkte-Popups */}
            {playerPopups.map(
              (popup, popupIndex) => (
                <div
                  key={popup.id}
                  className="quiz-score-popup absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none font-display font-bold whitespace-nowrap"
                  style={{ top: `${-20 - popupIndex * 24}px` }}
                >
                  {popup.amount > 0 ? "+" : "−"}
                  {Math.abs(popup.amount)}
                </div>
              )
            )}
            {/* Spielername */}
            <div
              className={`
                relative z-10
                text-[9px] md:text-[10px]
                uppercase
                tracking-[0.24em]
                mb-1.5
                font-medium
                truncate
                ${
                  isLeader
                    ? "text-amber-200/80"
                    : "text-muted-foreground"
                }
              `}
            >
              <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: playerColor(i, p.color) }} />
              {p.name}
            </div>
            {/* Punktestand / Bearbeitung */}
            {isEditing ? (
              <div className="relative z-10 flex items-center justify-center gap-1 mt-1">
                <input
                  type="number"
                  step="1"
                  value={editValue}
                  onChange={(e) =>
                    setEditValue(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveScore(i);
                    }
                    if (e.key === "Escape") {
                      cancelEditing();
                    }
                  }}
                  autoFocus
                  className="
                    w-24 md:w-28
                    h-9
                    rounded-xl
                    bg-black/25
                    border border-primary/30
                    px-2
                    text-center
                    font-display
                    text-xl
                    text-foreground
                    outline-none
                    focus:border-primary
                    focus:shadow-[0_0_15px_rgba(99,102,241,0.25)]
                  "
                />
                <button
                  type="button"
                  onClick={() => saveScore(i)}
                  className="
                    h-9 w-9
                    rounded-xl
                    flex items-center justify-center
                    bg-emerald-500/15
                    text-emerald-400
                    hover:bg-emerald-500/25
                    transition-colors
                  "
                  title="Punktestand speichern"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="
                    h-9 w-9
                    rounded-xl
                    flex items-center justify-center
                    bg-destructive/15
                    text-destructive
                    hover:bg-destructive/25
                    transition-colors
                  "
                  title="Abbrechen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEditing(i)}
                disabled={!onScoreChange}
                className={`
                  relative z-10
                  mx-auto
                  flex items-center justify-center
                  gap-2
                  rounded-xl
                  px-3 py-0.5
                  transition-all
                  duration-200
                  ${
                    onScoreChange
                      ? "cursor-pointer hover:bg-white/[0.06]"
                      : "cursor-default"
                  }
                `}
                title={
                  onScoreChange
                    ? "Punktestand korrigieren"
                    : undefined
                }
              >
                <span
                  className={`
                    font-display
                    text-2xl md:text-[2rem]
                    leading-none
                    transition-all
                    duration-200
                    ${
                      p.score < 0
                        ? "text-destructive"
                        : isLeader
                          ? "text-foreground"
                          : "text-foreground"
                    }
                  `}
                  style={{
                    textShadow: isLeader
                      ? "0 0 22px rgba(251,191,36,0.28)"
                      : p.score > 0
                        ? "0 0 22px oklch(0.55 0.24 278 / 0.55)"
                        : undefined,
                  }}
                >
                  <AnimatedScore score={p.score} />
                </span>
                {onScoreChange && (
                  <Pencil
                    className="
                      h-3.5 w-3.5
                      text-muted-foreground/50
                      opacity-40
                      transition-all
                      duration-200
                      group-hover/player:opacity-100
                      group-hover/player:text-primary
                    "
                  />
                )}
              </button>
            )}
            {/* Führungs-Akzent unten */}
            {isLeader && (
              <div
                className="
                  absolute
                  bottom-0
                  left-1/2
                  -translate-x-1/2
                  h-px
                  w-1/2
                  bg-gradient-to-r
                  from-transparent
                  via-amber-400/60
                  to-transparent
                "
              />
            )}

          </div>
        );
      })}
    </div>
  );
}