type Point = { x: number; y: number };
interface Moment {
  start: number;
  duration: number;
  points: Point[];
  bright: boolean;
}
const between = (a: number, b: number) => a + Math.random() * (b - a);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
const surfaces =
  'button,input,video,img,[role="dialog"],.glass-strong,.quiz-player-card,.quiz-category-card,.quiz-question-card,header,h1';

// Only at the start of a rare event: try trajectories near opposite margins
// and avoid foreground controls. Coordinates remain normalized across resizes.
function place(kind: "meteor" | "stars", width: number, height: number, bright: boolean) {
  let best: Point[] = [],
    bestScore = -1;
  const count = kind === "meteor" ? 2 : Math.floor(between(3, 6));
  for (let attempt = 0; attempt < 8; attempt++) {
    const left = Math.random() < 0.5;
    const span =
      kind === "meteor"
        ? Math.min(width * 0.25, between(135, bright ? 350 : 245))
        : Math.min(width * 0.17, between(64, 116));
    const x = left ? between(0.02, 0.18) : between(0.82, 0.98);
    const y = between(0.06, 0.73);
    const points = Array.from({ length: count }, (_, i) => ({
      x: x + ((((left ? 1 : -1) * span) / width) * i) / (count - 1),
      y:
        y +
        (kind === "meteor" ? i * span * between(0.24, 0.52) : i * 6 + between(-14, 14)) / height,
    }));
    let score = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i],
        next = points[i + 1] ?? p;
      for (const t of [0, 0.5]) {
        const el = document.elementFromPoint(
          mix(p.x, next.x, t) * width,
          mix(p.y, next.y, t) * height,
        );
        if (el && !el.closest(surfaces)) score++;
      }
    }
    if (score > bestScore) {
      best = points;
      bestScore = score;
    }
    if (score === count * 2) break;
  }
  return best;
}

export function createSkyEvents() {
  let meteorAt = between(45, 100),
    starsAt = between(105, 175);
  let meteor: Moment | undefined, stars: Moment | undefined;
  return (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => {
    if (time >= meteorAt && !stars) {
      const bright = Math.random() < 0.075;
      meteor = {
        start: time,
        duration: between(0.8, 1.2),
        points: place("meteor", width, height, bright),
        bright,
      };
      meteorAt = time + between(45, 100);
    }
    if (time >= starsAt && !meteor && time + 7 < meteorAt) {
      stars = {
        start: time,
        duration: 6.4,
        points: place("stars", width, height, false),
        bright: false,
      };
      starsAt = time + between(115, 190);
    }
    if (meteor) {
      const t = (time - meteor.start) / meteor.duration;
      if (t >= 1) meteor = undefined;
      else {
        const [a, b] = meteor.points;
        const dx = (b.x - a.x) * width,
          dy = (b.y - a.y) * height;
        const head = 0.03 + 0.97 * t,
          tail = Math.max(0, head - (meteor.bright ? 0.43 : 0.33));
        const hx = a.x * width + dx * head,
          hy = a.y * height + dy * head;
        const tx = a.x * width + dx * tail,
          ty = a.y * height + dy * tail;
        const streak = ctx.createLinearGradient(tx, ty, hx, hy);
        streak.addColorStop(0, "rgba(166,145,249,0)");
        streak.addColorStop(0.55, "rgba(172,182,247,.28)");
        streak.addColorStop(1, "rgba(223,238,255,.97)");
        ctx.globalAlpha = smooth(t / 0.18) * smooth((1 - t) / 0.32) * (meteor.bright ? 0.95 : 0.75);
        ctx.strokeStyle = streak;
        ctx.lineWidth = meteor.bright ? 1.55 : 1.12;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.fillStyle = "#e1ebff";
        ctx.beginPath();
        ctx.arc(hx, hy, meteor.bright ? 1.45 : 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    if (stars) {
      const t = (time - stars.start) / stars.duration;
      if (t >= 1) stars = undefined;
      else {
        ctx.globalAlpha = smooth(t / 0.25) * smooth((1 - t) / 0.32);
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = "rgba(168,177,232,.32)";
        ctx.fillStyle = "rgba(223,225,252,.72)";
        stars.points.forEach((p, i, pts) => {
          const next = pts[i + 1];
          if (next) {
            const u = smooth((t / 0.49) * (pts.length - 1) - i);
            ctx.beginPath();
            ctx.moveTo(p.x * width, p.y * height);
            ctx.lineTo(mix(p.x, next.x, u) * width, mix(p.y, next.y, u) * height);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(p.x * width, p.y * height, i % 2 ? 1 : 1.35, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    }
    ctx.globalAlpha = 1;
  };
}
