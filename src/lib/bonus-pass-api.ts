import { supabase } from "./supabase";
import type { BonusQuestion } from "./bonus-rounds";

export interface BonusPlayer { name: string; color: string }
export interface BonusGuestState {
  code: string;
  question: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  players: BonusPlayer[];
  nextPlayer: number;
  submitted: number;
  status: "waiting" | "collecting" | "ready" | "revealed";
}
export interface BonusHostState {
  phoneOnline?: boolean;
  submitted: number;
  status: "waiting" | "collecting" | "ready" | "revealed";
  guesses: number[];
}
export interface BonusSession {
  id: string;
  hostToken: string;
  code: string;
}
function checked<T>(data: unknown, error: { message: string; code?: string } | null): T {
  if (error) {
    if (["PGRST202", "42883"].includes(error.code ?? ""))
      throw new Error("Die Handy-Funktion ist noch nicht eingerichtet. Bitte zuerst die Bonus-SQL-Migration in Supabase ausführen.");
    throw new Error(error.message);
  }
  return data as T;
}
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(random, n => chars[n % chars.length]).join("");
}
export async function createBonusSession(quizId: string, q: BonusQuestion, players: BonusPlayer[]): Promise<BonusSession> {
  const code = randomCode();
  const hostToken = crypto.randomUUID();
  const { data, error } = await supabase.rpc("bonus_pass_create", {
    p_code: code,
    p_host_token: hostToken,
    p_quiz_id: quizId,
    p_question: q.question,
    p_target: q.target,
    p_unit: q.unit,
    p_min: q.min,
    p_max: q.max,
    p_step: q.step,
    p_players: players.map(p => ({ name: p.name, color: p.color })),
  });
  return { id: checked<string>(data, error), hostToken, code };
}
/** Creates the one-time phone connection before the game starts. */
export async function prepareBonusSession(quizId: string, players: BonusPlayer[]): Promise<BonusSession> {
  const code = randomCode();
  const hostToken = crypto.randomUUID();
  const { data, error } = await supabase.rpc("bonus_pass_prepare", {
    p_code: code,
    p_host_token: hostToken,
    p_quiz_id: quizId,
    p_players: players,
  });
  return { id: checked<string>(data, error), hostToken, code };
}

/** Activates a prepared phone connection for a new question without changing its code. */
export async function activateBonusSession(session: BonusSession, q: BonusQuestion): Promise<BonusHostState> {
  const { data, error } = await supabase.rpc("bonus_pass_activate", {
    p_id: session.id,
    p_host_token: session.hostToken,
    p_question: q.question,
    p_target: q.target,
    p_unit: q.unit,
    p_min: q.min,
    p_max: q.max,
    p_step: q.step,
  });
  return checked<BonusHostState>(data, error);
}

export async function readBonusGuest(code: string): Promise<BonusGuestState> {
  const { data, error } = await supabase.rpc("bonus_pass_guest", { p_code: code });
  return checked<BonusGuestState>(data, error);
}
export async function sendBonusGuess(code: string, playerIndex: number, guess: number) {
  const { data, error } = await supabase.rpc("bonus_pass_submit", {
    p_code: code, p_player: playerIndex, p_guess: guess,
  });
  return checked<{ submitted: number; status: string }>(data, error);
}
export async function readBonusHost(s: BonusSession): Promise<BonusHostState> {
  const { data, error } = await supabase.rpc("bonus_pass_host", {
    p_id: s.id, p_host_token: s.hostToken,
  });
  return checked<BonusHostState>(data, error);
}
export async function revealBonus(s: BonusSession): Promise<BonusHostState> {
  const { data, error } = await supabase.rpc("bonus_pass_reveal", {
    p_id: s.id, p_host_token: s.hostToken,
  });
  return checked<BonusHostState>(data, error);
}
