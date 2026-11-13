import assert from "node:assert/strict";
import {
  createLightParticles,
  particleSample,
  particleBudget,
  canvasDpr,
  startParticleCanvas,
} from "../src/lib/ambient-particles.ts";
const field = createLightParticles();
assert.deepEqual(field, createLightParticles());
assert.equal(field.length, 32);
assert.equal(particleBudget(1920, 1080), 32);
assert.equal(particleBudget(390, 844), 16);
assert.equal(particleBudget(1920, 1080, 4), 24);
assert.ok(canvasDpr(1920, 1080, 3) <= 1.5);
assert.ok(7680 * 4320 * canvasDpr(7680, 4320, 2) ** 2 <= 4000001);
for (const p of field) {
  for (let t = 0; t < 90; t += 1 / 60) {
    const a = particleSample(p, t),
      b = particleSample(p, t + 1 / 60);
    assert.ok(Math.hypot(a.dx - b.dx, a.dy - b.dy) < 0.12, "No per-frame position jumps");
    assert.ok(a.alpha > 0 && a.alpha < 1);
  }
  assert.deepEqual(
    particleSample(p, 10),
    particleSample(p, 1200 / 120),
    "Refresh-rate independent sampling",
  );
}
class Target extends EventTarget {
  listeners = 0;
  addEventListener(...args: any[]) {
    this.listeners++;
    super.addEventListener(args[0], args[1]);
  }
  removeEventListener(...args: any[]) {
    this.listeners--;
    super.removeEventListener(args[0], args[1]);
  }
}
const media = Object.assign(new Target(), { matches: false });
const win = Object.assign(new Target(), {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 2,
  matchMedia: () => media,
});
let covered = false;
let observerCallback: () => void = () => {};
let disconnected = false;
let clears = 0;
let positions: number[][] = [];
let matrix: number[] = [];
const ctx: any = {
  clearRect() {
    clears++;
    positions = [];
  },
  setTransform(...args: number[]) {
    matrix = args;
  },
  beginPath() {},
  arc(x: number, y: number) {
    positions.push([x, y]);
  },
  fill() {},
  drawImage(_image: unknown, x: number, y: number, width: number) {
    if (width !== 14) positions.push([x, y]);
  },
  translate() {},
  rotate() {},
  createLinearGradient() { return { addColorStop() {} }; },
  createRadialGradient() {
    return { addColorStop() {} };
  },
  fillRect() {},
};
const doc = Object.assign(new Target(), {
  hidden: false,
  querySelector: () => (covered ? {} : null),
  body: {},
  createElement: () => ({ getContext: () => ctx }),
});
Object.assign(globalThis, {
  window: win,
  document: doc,
  MutationObserver: class {
    constructor(callback: () => void) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  },
});
Object.defineProperty(globalThis, "navigator", {
  value: { hardwareConcurrency: 8 },
  configurable: true,
});
let next = 0;
const queue = new Map<number, FrameRequestCallback>();
globalThis.requestAnimationFrame = (callback) => {
  queue.set(++next, callback);
  return next;
};
globalThis.cancelAnimationFrame = (id) => {
  queue.delete(id);
};
const frame = (now: number) => {
  const pending = [...queue.values()];
  queue.clear();
  pending.forEach((cb) => cb(now));
};
const canvas: any = { getContext: () => ctx, width: 0, height: 0 };
const stop = startParticleCanvas(canvas);
assert.equal(queue.size, 1);
assert.ok(canvas.width <= 2880);
assert.equal(matrix[0], canvasDpr(1920, 1080, 2));
assert.equal(positions.length, 32);
frame(100);
frame(116.667);
const before = positions.map((p) => [...p]);
frame(133.334);
assert.deepEqual(positions, before);
doc.hidden = true;
doc.dispatchEvent(new Event("visibilitychange"));
assert.equal(queue.size, 0);
const hidden = clears;
frame(20000);
assert.equal(clears, hidden);
doc.hidden = false;
doc.dispatchEvent(new Event("visibilitychange"));
const resume = positions.map((p) => [...p]);
frame(50000);
assert.deepEqual(positions, resume, "No jump after hidden tab");
media.matches = true;
media.dispatchEvent(new Event("change"));
assert.equal(queue.size, 0);
assert.equal(positions.length, 32);
win.innerWidth = 390;
win.innerHeight = 844;
win.dispatchEvent(new Event("resize"));
assert.equal(positions.length, 16);
assert.equal(queue.size, 0);
media.matches = false;
media.dispatchEvent(new Event("change"));
assert.equal(queue.size, 1);
covered = true;
observerCallback();
assert.equal(queue.size, 0);
covered = false;
observerCallback();
assert.equal(queue.size, 1);
stop();
assert.equal(queue.size, 0);
assert.ok(disconnected);
assert.equal(win.listeners, 0);
assert.equal(doc.listeners, 0);
assert.equal(media.listeners, 0);
console.log(
  "PASS particles: deterministic sampling, frame continuity, DPI/count budgets, one loop, pause/resume, reduced motion, resize, dialog pause, cleanup.",
);
