interface Player {
  name: string;
  score: number;
}

export function ScoreBoard({ players }: { players: Player[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {players.map((p, i) => (
        <div
          key={i}
          className="glass rounded-2xl px-3 py-3 md:px-4 md:py-4 text-center"
        >
          <div className="text-[10px] md:text-xs text-muted-foreground truncate uppercase tracking-[0.2em] mb-1">
            {p.name}
          </div>
          <div
            className={`font-display text-2xl md:text-3xl ${
              p.score < 0 ? "text-destructive" : "text-foreground"
            }`}
            style={p.score > 0 ? { textShadow: "0 0 24px oklch(0.55 0.24 278 / 0.7)" } : undefined}
          >
            {p.score}
          </div>
        </div>
      ))}
    </div>
  );
}
