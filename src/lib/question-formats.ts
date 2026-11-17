import type { Question } from "./jeopardy-data";

export interface EstimateSettings {
  target?: number;
  unit: string;
  input: "number" | "slider";
  min: number;
  max: number;
  step: number;
  tolerance: number;
  toleranceType: "percent" | "absolute";
}
export interface RevealSettings {
  method: "tiles" | "mosaic" | "blur";
  advance: "manual" | "auto";
  seconds: number;
  deduction: number;
  floor: number;
  medium: "image" | "video";
}
export interface ImagePoint {
  x: number;
  y: number;
}
export interface LocationSettings {
  target?: ImagePoint;
  aspect?: number;
  radius: number;
}
export interface FormatAttempt {
  estimate?: number;
  pin?: ImagePoint;
}
export interface FormatRound {
  owner?: number;
  stage?: number;
  locked?: FormatAttempt;
}
export type RoundAction =
  | { kind: "claim"; player: number }
  | { kind: "advance" }
  | { kind: "lock"; attempt: FormatAttempt };
export const REVEAL_STAGES = 6;
export function nextRound(round: FormatRound, action: RoundAction): FormatRound {
  if (round.locked) return round;
  switch (action.kind) {
    case "claim":
      return round.owner === undefined ? { ...round, owner: action.player } : round;
    case "advance":
      return { ...round, stage: Math.min(REVEAL_STAGES, (round.stage ?? 0) + 1) };
    case "lock":
      return { ...round, locked: action.attempt };
  }
}
export function estimateSettings(q: Question): EstimateSettings {
  return {
    unit: "",
    input: "number",
    min: 0,
    max: 100,
    step: 1,
    tolerance: 10,
    toleranceType: "percent",
    ...q.estimate,
  };
}
export function revealSettings(q: Question, start: number): RevealSettings {
  return {
    method: "tiles",
    advance: "manual",
    seconds: 5,
    deduction: Math.max(1, Math.round(start / REVEAL_STAGES)),
    floor: 0,
    medium: q.imageUrl ? "image" : "video",
    ...q.reveal,
  };
}
export function locationSettings(q: Question): LocationSettings {
  return { radius: 5, ...q.location };
}
export function revealValue(start: number, config: RevealSettings, stage: number) {
  return Math.max(config.floor, start - stage * config.deduction);
}
/** A single rule label shown immediately below the estimation question. */
export function estimateToleranceLabel(s: EstimateSettings): string {
  const amount = s.tolerance.toLocaleString("de-DE", { maximumFractionDigits: 12 });
  const unit = s.toleranceType === "percent" ? " %" : s.unit.trim() ? ` ${s.unit.trim()}` : "";
  return `Toleranz: ±${amount}${unit}`;
}

export function estimateHit(s: EstimateSettings, guess: number) {
  if (!Number.isFinite(s.target) || !Number.isFinite(guess)) return false;
  const target = s.target!;
  const margin =
    s.toleranceType === "percent" ? Math.abs(target) * (s.tolerance / 100) : s.tolerance;
  const difference = Math.abs(guess - target);
  return (
    difference <= margin ||
    (margin > 0 &&
      difference - margin <=
        Number.EPSILON * Math.max(Math.abs(target), Math.abs(guess), margin) * 2)
  );
}
export function validPoint(p?: ImagePoint) {
  return !!p && [p.x, p.y].every((n) => Number.isFinite(n) && n >= 0 && n <= 1);
}
export function locationHit(s: LocationSettings, guess: ImagePoint) {
  if (!validPoint(s.target) || !validPoint(guess) || !s.aspect || s.aspect <= 0) return false;
  const dx = (guess.x - s.target!.x) * Math.max(1, s.aspect);
  const dy = (guess.y - s.target!.y) * Math.max(1, 1 / s.aspect);
  return Math.hypot(dx, dy) <= s.radius / 100 + Number.EPSILON;
}
export function formatError(q: Question, start: number): string | undefined {
  if (q.type === "estimate") {
    const s = estimateSettings(q);
    if (!Number.isFinite(s.target)) return "Trage die richtige Zahl ein.";
    if (!Number.isFinite(s.tolerance) || s.tolerance < 0)
      return "Die Toleranz muss mindestens 0 sein.";
    if (s.input === "slider") {
      if (
        ![s.min, s.max, s.step].every(Number.isFinite) ||
        s.max <= s.min ||
        s.step <= 0 ||
        s.step > s.max - s.min
      )
        return "Prüfe den Sliderbereich und die positive Schrittweite.";
      if (s.target! < s.min || s.target! > s.max)
        return "Die richtige Zahl muss im Sliderbereich liegen.";
      const index = Math.min(
        Math.round((s.target! - s.min) / s.step),
        Math.floor((s.max - s.min) / s.step + 1e-10),
      );
      const nearest = Number((s.min + index * s.step).toPrecision(15));
      if (!estimateHit(s, nearest))
        return "Mit dieser Schrittweite ist kein Treffer innerhalb der Toleranz möglich.";
    }
  }
  if (q.type === "reveal") {
    const s = revealSettings(q, start);
    if (!q.answer.trim()) return "Trage die Lösung zum Motiv ein.";
    if (!q.imageUrl && !q.videoUrl) return "Füge ein Bild oder Video zum Enthüllen hinzu.";
    if (
      !Number.isSafeInteger(start) ||
      start < 0 ||
      !Number.isSafeInteger(s.deduction) ||
      s.deduction <= 0 ||
      !Number.isSafeInteger(s.floor) ||
      s.floor < 0 ||
      s.floor > start
    )
      return "Prüfe die Punkte: positiver Abzug und Mindestwert zwischen 0 und Startwert.";
    if (s.advance === "auto" && (!Number.isFinite(s.seconds) || s.seconds < 1 || s.seconds > 300))
      return "Wähle ein Intervall zwischen 1 und 300 Sekunden.";
  }
  if (q.type === "location") {
    const s = locationSettings(q);
    if (!q.imageUrl) return "Füge das Bild hinzu, auf dem geraten wird.";
    if (!validPoint(s.target) || !Number.isFinite(s.aspect) || !(s.aspect! > 0))
      return "Markiere die richtige Stelle im Bild.";
    if (!Number.isFinite(s.radius) || s.radius <= 0 || s.radius > 100)
      return "Der Trefferradius muss größer als 0 und höchstens 100 % sein.";
  }
}
