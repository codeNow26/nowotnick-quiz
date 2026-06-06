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
          className="bg-card border-2 border-primary/40 rounded-xl px-3 py-2 md:px-4 md:py-3 text-center shadow-lg"
        >
          <div className="text-xs md:text-sm text-muted-foreground truncate uppercase tracking-wider">
            {p.name}
          </div>
          <div
            className={`font-display text-xl md:text-3xl text-shadow-gold ${
              p.score < 0 ? "text-destructive" : "text-primary"
            }`}
          >
            ${p.score}
          </div>
        </div>
      ))}
    </div>
  );
}
