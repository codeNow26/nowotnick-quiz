import type { PlayerStats } from "@/components/jeopardy/GameStats";
import type { Category, QuestionResult } from "./jeopardy-data";

export interface SavedPlayer {
  name: string;
  color: string;
  score: number;
}
type StoredResult = Omit<QuestionResult, "question">;

export interface SavedGame {
  version: 1;
  quizId: string;
  quizUpdatedAt: string | null;
  savedAt: number;
  categoryCount: number;
  questionRows: 5 | 6;
  players: SavedPlayer[];
  answered: boolean[][];
  results: Record<string, StoredResult>;
  stats: PlayerStats[];
}

const keyFor = (quizId: string) => `nowotnick-game:v1:${quizId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Only persist score state and small result metadata. Never duplicate
 * media data URLs from the quiz in localStorage. */
export function compactResults(results: Record<string, QuestionResult>): SavedGame["results"] {
  return Object.fromEntries(
    Object.entries(results).map(([key, result]) => [key, {
      category: result.category,
      value: result.value,
      playerIndex: result.playerIndex,
      correct: result.correct,
      selectedChoice: result.selectedChoice ?? null,
    }]),
  );
}

export function restoreResults(
  stored: SavedGame,
  categories: Category[],
): Record<string, QuestionResult> {
  const result: Record<string, QuestionResult> = {};
  for (const [key, data] of Object.entries(stored.results)) {
    const match = /^(\d+):(\d+)$/.exec(key);
    if (!match) continue;
    const catIdx = Number(match[1]);
    const rowIdx = Number(match[2]);
    const category = categories[catIdx];
    const question = category?.questions[rowIdx];
    if (!category || !question || !stored.answered[catIdx]?.[rowIdx]) continue;
    result[key] = {
      question,
      category: data.category,
      value: data.value,
      playerIndex: data.playerIndex,
      correct: data.correct,
      selectedChoice: data.selectedChoice,
    };
  }
  return result;
}

export function readSavedGame(quizId: string, quizUpdatedAt: string | null): SavedGame | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(keyFor(quizId));
    if (!value) return null;
    const data: unknown = JSON.parse(value);
    if (!isRecord(data) || data.version !== 1 || data.quizId !== quizId ||
        data.quizUpdatedAt !== quizUpdatedAt || typeof data.savedAt !== "number" ||
        !Number.isFinite(data.savedAt) || !Number.isInteger(data.categoryCount) ||
        (data.categoryCount as number) < 1 || (data.categoryCount as number) > 10 ||
        (data.questionRows !== 5 && data.questionRows !== 6) ||
        !Array.isArray(data.players) || data.players.length < 1 || data.players.length > 6 ||
        !data.players.every(p => isRecord(p) && typeof p.name === "string" &&
          typeof p.color === "string" && typeof p.score === "number" && Number.isFinite(p.score)) ||
        !Array.isArray(data.answered) || data.answered.length !== data.categoryCount ||
        !data.answered.every(row => Array.isArray(row) &&
          row.length === data.questionRows && row.every(v => typeof v === "boolean")) ||
        !isRecord(data.results) || !Array.isArray(data.stats) ||
        data.stats.length !== data.players.length ||
        !data.stats.every(x => isRecord(x) && [
          "mainCorrect","mainWrong","pointsWon","pointsLost","highestScore",
          "biggestGain","biggestLoss","leadershipChanges",
        ].every(k => typeof x[k] === "number" && Number.isFinite(x[k] as number)))) {
      return null;
    }
    for (const [key, value] of Object.entries(data.results)) {
      if (!/^(\d+):(\d+)$/.test(key) || !isRecord(value) ||
          typeof value.category !== "string" || typeof value.value !== "number" ||
          !Number.isFinite(value.value) || typeof value.correct !== "boolean" ||
          (value.playerIndex !== null && (typeof value.playerIndex !== "number" ||
            !Number.isInteger(value.playerIndex) ||
            value.playerIndex < 0 || value.playerIndex >= data.players.length)) ||
          (value.selectedChoice !== undefined && value.selectedChoice !== null &&
            (typeof value.selectedChoice !== "number" || !Number.isInteger(value.selectedChoice) ||
             value.selectedChoice < 0 || value.selectedChoice > 3))) return null;
    }
    return data as unknown as SavedGame;
  } catch {
    return null;
  }
}

export function writeSavedGame(game: SavedGame): boolean {
  try {
    window.localStorage.setItem(keyFor(game.quizId), JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}

export function discardSavedGame(quizId: string): void {
  try { window.localStorage.removeItem(keyFor(quizId)); } catch { /* private mode */ }
}
