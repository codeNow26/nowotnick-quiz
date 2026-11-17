import assert from "node:assert/strict";
import {
  nextRound,
  estimateSettings,
  estimateHit,
  locationSettings,
  locationHit,
  revealSettings,
  revealValue,
  formatError,
} from "../src/lib/question-formats";
import type { Question } from "../src/lib/jeopardy-data";

const q: Question = {
  type: "estimate",
  question: "Temperatur?",
  answer: "",
  estimate: { target: -20, tolerance: 10 },
};
const e = estimateSettings(q);
assert.equal(e.input, "number");
assert(estimateHit(e, -22));
assert(!estimateHit(e, -22.1));
assert(estimateHit({ ...e, target: 0, toleranceType: "absolute", tolerance: 0.1 }, -0.1));
assert(!estimateHit({ ...e, target: 0, tolerance: 0 }, 1e-8));
const slider: Question = {
  ...q,
  estimate: { target: 3, min: 0, max: 10, step: 2, input: "slider", tolerance: 0 },
};
assert(formatError(slider, 100));
assert.equal(formatError({ ...slider, estimate: { ...slider.estimate, step: 1 } }, 100), undefined);
for (const aspect of [2, 0.5]) {
  const l = locationSettings({
    question: "",
    answer: "",
    location: { target: { x: 0.5, y: 0.5 }, radius: 5, aspect },
  });
  assert(locationHit(l, { x: 0.5 + 0.05 / Math.max(1, aspect), y: 0.5 }));
  assert(!locationHit(l, { x: 0.5, y: 0.5 + 0.06 / Math.max(1, 1 / aspect) }));
}
const reveal: Question = {
  type: "reveal",
  question: "Motiv?",
  answer: "Erde",
  videoUrl: "video.webm",
  reveal: { deduction: 80, floor: 100 },
};
const r = revealSettings(reveal, 400);
assert.deepEqual(
  [0, 1, 2, 3, 4, 5, 6].map((n) => revealValue(400, r, n)),
  [400, 320, 240, 160, 100, 100, 100],
);
assert(!formatError(reveal, 400));
assert(formatError({ ...reveal, reveal: { floor: 600 } }, 400));
assert(formatError({ ...reveal, reveal: { advance: "auto", seconds: 0 } }, 400));
console.log("PASS Schätzung, Slider, Bildgeometrie und Enthüllungspunkte.");

const claimed = nextRound({}, { kind: "claim", player: 1 });
assert.equal(nextRound(claimed, { kind: "claim", player: 0 }).owner, 1);
const locked = nextRound(claimed, { kind: "lock", attempt: { estimate: -22 } });
assert.deepEqual(nextRound(locked, { kind: "lock", attempt: { estimate: 1000 } }), locked);
assert.deepEqual(nextRound(locked, { kind: "advance" }), locked);
assert.equal(nextRound({ stage: 6 }, { kind: "advance" }).stage, 6);
