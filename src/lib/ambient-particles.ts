/** Fixed anchors with seeded, irregular light events. No per-frame randomness. */
export interface LightParticle {
  x: number;
  y: number;
  radius: number;
  offset: number;
  period: number;
  events: { start: number; duration: number; strength: number }[];
  tint: string;
}
export function createLightParticles(): LightParticle[] {
  let seed = 7319;
  const anchorRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 32 }, (_, i) => {
    // Consume the former CSS field's seeded values to preserve its exact anchors.
    const x = 0.03 + anchorRandom() * 0.94,
      y = 0.03 + anchorRandom() * 0.94;
    if (i % 9 !== 0) anchorRandom();
    anchorRandom();
    anchorRandom();
    anchorRandom();
    if (i % 9 !== 0) {
      anchorRandom();
      anchorRandom();
    }
    let motionSeed = 1907 + i * 7919;
    const random = () => {
      motionSeed = (motionSeed * 16807) % 2147483647;
      return (motionSeed - 1) / 2147483646;
    };
    const radius = 0.45 + random() * 0.35;
    const events: LightParticle["events"] = [];
    let period = 0;
    for (let event = 0; event < 8; event++) {
      period += 9 + random() * 24;
      const duration = 1 + random() * 1.5;
      events.push({ start: period, duration, strength: 0.65 + random() * 0.35 });
      period += duration;
    }
    period += 8 + random() * 12;
    return {
      x,
      y,
      radius,
      events,
      period,
      offset: random() * period,
      tint: i % 7 === 0 ? "187,215,255" : i % 3 === 0 ? "220,210,255" : "242,244,255",
    };
  });
}
export function particleSample(p: LightParticle, time: number) {
  const local = (time + p.offset) % p.period;
  let sparkle = 0;
  for (const event of p.events) {
    if (local >= event.start && local <= event.start + event.duration) {
      // Zero slope at both ends, no blinking or visible cycle boundary.
      sparkle = Math.sin((Math.PI * (local - event.start)) / event.duration) ** 2 * event.strength;
      break;
    }
  }
  return { dx: 0, dy: 0, alpha: 0.3, sparkle };
}

export function particleBudget(width: number, height: number, cores = 8) {
  return Math.min(width <= 640 ? 16 : width * height < 1100000 ? 24 : 32, cores <= 4 ? 24 : 32);
}
export function canvasDpr(width: number, height: number, dpr: number) {
  return Math.min(Math.max(dpr, 1), 1.5, Math.sqrt(4000000 / Math.max(1, width * height)));
}

/** One rAF loop, paused when hidden, covered, or reduced-motion is requested. */
export function startParticleCanvas(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};
  const particles = createLightParticles();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 1,
    height = 1,
    count = 16,
    frame = 0,
    last: number | null = null,
    elapsed = 0,
    disposed = false,
    covered = false;
  // Tiny offscreen sprites cache the soft kernels; no per-frame gradients/blur.
  const sprites = new Map<string, HTMLCanvasElement>();
  for (const tint of new Set(particles.map((p) => p.tint))) {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const c = sprite.getContext("2d");
    if (!c) continue;
    const glow = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, `rgba(${tint},1)`);
    glow.addColorStop(0.14, `rgba(${tint},.95)`);
    glow.addColorStop(0.32, `rgba(${tint},.28)`);
    glow.addColorStop(0.62, `rgba(${tint},.06)`);
    glow.addColorStop(1, `rgba(${tint},0)`);
    c.fillStyle = glow;
    c.fillRect(0, 0, 32, 32);
    sprites.set(tint, sprite);
  }
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const special = Math.max(1, Math.round(count * 0.05));
    const soft = Math.round(count * 0.25);
    for (let i = 0; i < count; i++) {
      const p = particles[i],
        s = particleSample(p, elapsed);
      const x = p.x * width,
        y = p.y * height;
      const highlight = i < special,
        softCore = i < special + soft;
      const sparkle = reduced.matches ? 0 : s.sparkle;
      ctx.globalAlpha = softCore
        ? 0.48 + sparkle * (highlight ? 0.5 : 0.36)
        : s.alpha + sparkle * 0.18;
      const sprite = sprites.get(p.tint);
      // A compact radial kernel for every point, not a hard filled disc.
      // The size stays fixed; only luminance changes during each event.
      const size = (highlight ? 5.4 : softCore ? 4.8 : 3.2) * (p.radius / 0.65);
      if (sprite) ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };
  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = null;
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden || covered || reduced.matches) {
      last = null;
      return;
    }
    // Cap exceptionally delayed frames, avoiding a visible leap after a stall.
    if (last !== null) elapsed += Math.min(Math.max(0, now - last), 50) / 1000;
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    stop();
    if (disposed || document.hidden || covered) return;
    draw();
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    count = particleBudget(width, height, navigator.hardwareConcurrency || 8);
    const dpr = canvasDpr(width, height, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sync();
  };
  const checkCovered = () => {
    const next = !!document.querySelector('[role="dialog"][data-state="open"]');
    if (next !== covered) {
      covered = next;
      sync();
    }
  };
  const observer = new MutationObserver(checkCovered);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-state"],
  });
  covered = !!document.querySelector('[role="dialog"][data-state="open"]');
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  resize();
  return () => {
    disposed = true;
    stop();
    observer.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
    sprites.clear();
    ctx.clearRect(0, 0, width, height);
  };
}
