interface Player {
  name: string;
  score: number;
}

export function ScoreBoard({ players }: { players: Player[] }) {
  const highestScore =
    players.length > 0 ? Math.max(...players.map((p) => p.score)) : 0;

  const leaders = players.filter((p) => p.score === highestScore);
  const hasSingleLeader = leaders.length === 1;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {players.map((p, i) => {
        const isLeader = hasSingleLeader && p.score === highestScore;

        return (
          <div
            key={i}
            className={`glass rounded-2xl px-3 py-3 md:px-4 md:py-4 text-center transition-all ${
              isLeader ? "scale-[1.03]" : ""
            }`}
          >
            <div className="text-[10px] md:text-xs text-muted-foreground truncate uppercase tracking-[0.2em] mb-1 flex items-center justify-center gap-1">
              {isLeader && <span className="text-base">👑</span>}
              <span>{p.name}</span>
            </div>

            <div
              className={`font-display text-2xl md:text-3xl ${
                p.score < 0 ? "text-destructive" : "text-foreground"
              }`}
              style={
                p.score > 0
                  ? {
                      textShadow:
                        "0 0 24px oklch(0.55 0.24 278 / 0.7)",
                    }
                  : undefined
              }
            >
              {p.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}