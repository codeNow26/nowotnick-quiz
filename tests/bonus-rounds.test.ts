import assert from "node:assert/strict";
import {
  bonusMilestone, bonusQuestionError, bonusRanking, readBonusSettings,
  type BonusQuestion,
} from "../src/lib/bonus-rounds";

const sample: BonusQuestion = {
  id: "everest", question: "Wie hoch ist der Mount Everest?",
  target: 8849, unit: "m", min: 0, max: 12000, step: 1, points: 500,
};
assert.equal(bonusQuestionError(sample), null);
assert.equal(bonusQuestionError({ ...sample, question: "" }), "Bitte eine Schätzfrage eintragen.");
assert(bonusQuestionError({ ...sample, step: 100 }));
assert(bonusQuestionError({ ...sample, target: 14000 }));
assert.equal(readBonusSettings(undefined).enabled, false);
assert.equal(readBonusSettings(undefined).rounds.length, 0);
const config = readBonusSettings({ enabled: true, startPercent: 20, endPercent: 80, rounds: [sample, sample, sample] });
assert.deepEqual([0, 1, 2].map(i => bonusMilestone(i, 30, config)), [6, 15, 24]);
assert.equal(bonusMilestone(0, 30, { ...config, rounds: [sample] }), 15);
const ranking = bonusRanking([8200, 9100, 7600, 10100], 8849);
assert.deepEqual(ranking.map(r => r.playerIndex), [1, 0, 2, 3]);
assert.deepEqual(ranking.map(r => r.difference), [251, 649, 1249, 1251]);
assert.deepEqual(ranking.filter(r => r.winner).map(r => r.playerIndex), [1]);
assert.deepEqual(bonusRanking([9, 11, 15], 10).filter(r => r.winner).map(r => r.playerIndex), [0, 1]);
console.log("PASS Bonus-Meilensteine, Zahlenvalidierung, Rangliste und Gleichstand.");
