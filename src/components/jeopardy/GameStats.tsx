import { Button } from "@/components/ui/button";
import {
  Crown,
  Target,
  Hand,
  TrendingUp,
  TrendingDown,
  Trophy,
  RotateCcw,
} from "lucide-react";

export interface PlayerStats {
  mainCorrect: number;
  mainWrong: number;
  coCorrect: number;
  coWrong: number;
  pointsWon: number;
  pointsLost: number;
  highestScore: number;
  biggestGain: number;
  biggestLoss: number;
  leadershipChanges: number;
}

interface Player {
  name: string;
  score: number;
}

interface GameStatsProps {
  players: Player[];
  stats: PlayerStats[];
  onClose: () => void;
  onNewGame: () => void;
}

function getNamesWithHighestValue(
  players: Player[],
  stats: PlayerStats[],
  getter: (stat: PlayerStats) => number
) {
  if (players.length === 0) return [];

  const highest = Math.max(...stats.map(getter));

  if (highest <= 0) return [];

  return players
    .filter((_, index) => getter(stats[index]) === highest)
    .map((player) => player.name);
}

export function GameStats({
  players,
  stats,
  onClose,
  onNewGame,
}: GameStatsProps) {
  const highestScore = Math.max(
    ...players.map((player) => player.score)
  );

  const winners = players.filter(
    (player) => player.score === highestScore
  );

  const quizKings = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.mainCorrect
  );

  const bestCoGuessers = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.coCorrect
  );

 const pointCollectors = getNamesWithHighestValue(
  players,
  stats,
  (stat) => stat.pointsWon
);

  const biggestLosses = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.biggestLoss
  );

  const throneRaiders = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.leadershipChanges
  );

  const getStatValue = (
    names: string[],
    getter: (stat: PlayerStats) => number
  ) => {
    if (names.length === 0) return 0;

    const index = players.findIndex(
      (player) => player.name === names[0]
    );

    return index >= 0 ? getter(stats[index]) : 0;
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-background/95 backdrop-blur-xl">
      <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 text-amber-400" />

          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Endergebnis
          </p>

          <h1
            className="font-display text-4xl md:text-6xl uppercase text-foreground"
            style={{
              textShadow:
                "0 0 35px oklch(0.55 0.24 278 / 0.7)",
            }}
          >
            {winners.length === 1
              ? `${winners[0].name} gewinnt!`
              : "Unentschieden!"}
          </h1>

          <p className="text-xl md:text-2xl mt-3 text-primary font-bold">
            {highestScore} Punkte
          </p>

          {winners.length > 1 && (
            <p className="mt-2 text-muted-foreground">
              {winners.map((winner) => winner.name).join(" & ")}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {players.map((player, index) => {
            const playerStats = stats[index];

            const mainTotal =
              playerStats.mainCorrect + playerStats.mainWrong;

            const coTotal =
              playerStats.coCorrect + playerStats.coWrong;

            const mainAccuracy =
              mainTotal > 0
                ? Math.round(
                    (playerStats.mainCorrect / mainTotal) * 100
                  )
                : 0;

            const coAccuracy =
              coTotal > 0
                ? Math.round(
                    (playerStats.coCorrect / coTotal) * 100
                  )
                : 0;

            const isWinner =
              player.score === highestScore;

            return (
              <div
                key={index}
                className={`glass-strong rounded-3xl p-5 md:p-6 border ${
                  isWinner
                    ? "border-amber-400/50 shadow-[0_0_35px_-10px_rgba(251,191,36,0.7)]"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Spieler
                    </p>

                    <h2 className="font-display text-2xl md:text-3xl uppercase flex items-center gap-2">
                      {isWinner && (
                        <Crown className="h-6 w-6 text-amber-400" />
                      )}

                      {player.name}
                    </h2>
                  </div>

                  <div
                    className={`font-display text-3xl ${
                      player.score < 0
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {player.score}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                      <Target className="h-4 w-4" />
                      Hauptfragen
                    </div>

                    <p className="text-lg font-bold">
                      <span className="text-emerald-400">
                        {playerStats.mainCorrect} ✓
                      </span>

                      {" · "}

                      <span className="text-destructive">
                        {playerStats.mainWrong} ✗
                      </span>
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {mainTotal > 0
                        ? `${mainAccuracy} % richtig`
                        : "Keine Hauptantwort"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                      <Hand className="h-4 w-4" />
                      Mitrater
                    </div>

                    <p className="text-lg font-bold">
                      <span className="text-emerald-400">
                        {playerStats.coCorrect} ✓
                      </span>

                      {" · "}

                      <span className="text-destructive">
                        {playerStats.coWrong} ✗
                      </span>
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {coTotal > 0
                        ? `${coAccuracy} % richtig`
                        : "Nicht mitgeraten"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Gewonnen
                    </div>

                    <p className="text-lg font-bold text-emerald-400">
                      +{playerStats.pointsWon}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-destructive/5 p-3">
                    <div className="flex items-center gap-2 text-destructive text-xs uppercase tracking-wider mb-2">
                      <TrendingDown className="h-4 w-4" />
                      Verloren
                    </div>

                    <p className="text-lg font-bold text-destructive">
                      −{playerStats.pointsLost}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-xl glass p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Höchststand
                    </p>

                    <p className="font-bold mt-1">
                      {playerStats.highestScore}
                    </p>
                  </div>

                  <div className="rounded-xl glass p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Bester Treffer
                    </p>

                    <p className="font-bold mt-1 text-emerald-400">
                      +{playerStats.biggestGain}
                    </p>
                  </div>

                  <div className="rounded-xl glass p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Größter Verlust
                    </p>

                    <p className="font-bold mt-1 text-destructive">
                      −{playerStats.biggestLoss}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-strong rounded-3xl p-5 md:p-8 mb-8 border border-white/10">
          <h2 className="font-display text-2xl md:text-3xl uppercase text-center mb-6">
            🏅 Awards
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizKings.length > 0 && (
              <Award
                emoji="🎯"
                title="Megamind"
                names={quizKings}
                detail={`${getStatValue(
                  quizKings,
                  (stat) => stat.mainCorrect
                )} richtige Hauptantworten`}
              />
            )}

            {bestCoGuessers.length > 0 && (
              <Award
                emoji="🙋"
                title="Sidekick"
                names={bestCoGuessers}
                detail={`${getStatValue(
                  bestCoGuessers,
                  (stat) => stat.coCorrect
                )} richtige Mitrater-Antworten`}
              />
            )}

           {pointCollectors.length > 0 && (
  <Award
    emoji="🔥"
    title="Punktemaster"
    names={pointCollectors}
    detail={`+${getStatValue(
      pointCollectors,
      (stat) => stat.pointsWon
    )} Punkte insgesamt erspielt`}
  />
)}

            {biggestLosses.length > 0 && (
              <Award
                emoji="💀"
                title="Loser"
                names={biggestLosses}
                detail={`−${getStatValue(
                  biggestLosses,
                  (stat) => stat.biggestLoss
                )} Punkte`}
              />
            )}

            {throneRaiders.length > 0 && (
              <Award
                emoji="👑"
                title="Thronräuber"
                names={throneRaiders}
                detail={`${getStatValue(
                  throneRaiders,
                  (stat) => stat.leadershipChanges
                )} FÜHRUNGSübernahmen`}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Zurück zum Board
          </Button>

          <Button
            onClick={onNewGame}
            className="rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Neues Spiel
          </Button>
        </div>
      </div>
    </div>
  );
}

function Award({
  emoji,
  title,
  names,
  detail,
}: {
  emoji: string;
  title: string;
  names: string[];
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
      <div className="text-3xl mb-2">{emoji}</div>

      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>

      <p className="font-display text-xl uppercase mt-1">
        {names.join(" & ")}
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        {detail}
      </p>
    </div>
  );
}