/** Configured separately from normal board questions. Disabled for all existing quizzes. */
export interface BonusQuestion {
  id: string;
  question: string;
  target?: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  points: number;
}
export interface BonusSettings {
  enabled: boolean;
  startPercent: number;
  endPercent: number;
  rounds: BonusQuestion[];
}
export interface BonusGuess {
  playerIndex: number;
  guess: number;
  difference: number;
  winner: boolean;
}

export function newBonusQuestion(index: number): BonusQuestion {
  return {
    id: crypto.randomUUID(),
    question: index === 0 ? "Wie hoch ist der Mount Everest?" : "",
    target: index === 0 ? 8849 : undefined,
    unit: index === 0 ? "m" : "",
    min: 0,
    max: index === 0 ? 12000 : 1000,
    step: 1,
    points: 500,
  };
}

export function readBonusSettings(raw: unknown): BonusSettings {
  const d = raw && typeof raw === "object" ? raw as Partial<BonusSettings> : {};
  return {
    enabled: d.enabled === true,
    startPercent: Number.isFinite(d.startPercent) ? Math.max(0, Math.min(100, d.startPercent!)) : 15,
    endPercent: Number.isFinite(d.endPercent) ? Math.max(0, Math.min(100, d.endPercent!)) : 85,
    rounds: Array.isArray(d.rounds)
      ? d.rounds.slice(0, 10).map((q, i) => ({
        id: typeof q?.id === "string" && q.id ? q.id : `bonus-${i}`,
        question: typeof q?.question === "string" ? q.question : "",
        target: Number.isFinite(q?.target) ? q.target : undefined,
        unit: typeof q?.unit === "string" ? q.unit : "",
        min: Number.isFinite(q?.min) ? q.min : 0,
        max: Number.isFinite(q?.max) ? q.max : 1000,
        step: Number.isFinite(q?.step) ? q.step : 1,
        points: Number.isFinite(q?.points) ? q.points : 500,
      }))
      : [],
  };
}

export function bonusMilestone(index: number, total: number, config: BonusSettings): number {
  if (config.rounds.length === 0 || total <= 0) return 0;
  const fraction = config.rounds.length === 1 ? 0.5 : index / (config.rounds.length - 1);
  const percent = config.startPercent + (config.endPercent - config.startPercent) * fraction;
  return Math.max(1, Math.min(total, Math.round((total * percent) / 100)));
}

export function bonusQuestionError(q: BonusQuestion): string | null {
  if (!q.question.trim()) return "Bitte eine Schätzfrage eintragen.";
  if (!Number.isFinite(q.target)) return "Die richtige Zahl fehlt.";
  if (![q.min, q.max, q.step].every(Number.isFinite) || q.min >= q.max || q.step <= 0)
    return "Minimum, Maximum oder Schrittweite sind ungültig.";
  if (q.target! < q.min || q.target! > q.max)
    return "Die richtige Zahl muss im Sliderbereich liegen.";
  if (!Number.isSafeInteger(q.points) || q.points <= 0 || q.points > 100000)
    return "Bonuspunkte müssen zwischen 1 und 100.000 liegen.";
  const closest = Math.round((q.target! - q.min) / q.step) * q.step + q.min;
  if (Math.abs(closest - q.target!) > Math.max(1e-8, Math.abs(q.target!) * 1e-12))
    return "Die richtige Zahl muss mit dem Slider erreichbar sein. Schrittweite anpassen.";
  return null;
}

export function bonusRanking(guesses: number[], target: number): BonusGuess[] {
  const minimum = Math.min(...guesses.map(g => Math.abs(g - target)));
  return guesses.map((guess, playerIndex) => ({
    playerIndex,
    guess,
    difference: Math.abs(guess - target),
    winner: Math.abs(Math.abs(guess - target) - minimum) < 1e-8,
  })).sort((a, b) => a.difference - b.difference || a.playerIndex - b.playerIndex);
}
