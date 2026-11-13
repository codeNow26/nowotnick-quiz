/** Stable anchors and continuously sampled motion. No per-frame random values. */
export interface LightParticle {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  ax: number;
  ay: number;
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
    return {
      x,
      y,
      radius: 0.45 + random() * 0.35,
      phase: random() * Math.PI * 2,
      speed: 0.19 + random() * 0.16,
      ax: 5 + random() * 7,
      ay: 4 + random() * 6,
      tint: i % 7 === 0 ? "187,215,255" : i % 3 === 0 ? "220,210,255" : "242,244,255",
    };
  });
}
export function particleSample(p: LightParticle, time: number) {
  const t = time * p.speed + p.phase;
  return {
    dx: p.ax * (Math.sin(t) * 0.78 + Math.sin(t * 0.47 + p.phase) * 0.22),
    dy: p.ay * (Math.cos(t * 0.81) * 0.8 + Math.sin(t * 0.39 + p.phase) * 0.2),
    alpha:
      0.55 + 0.1 * Math.sin(time * 0.43 + p.phase) + 0.035 * Math.sin(time * 0.71 + p.phase * 2),
    sparkle: Math.pow((1 + Math.sin(time * 0.36 + p.phase)) / 2, 14),
  };
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
    glow.addColorStop(0, `rgba(${tint},.65)`);
    glow.addColorStop(0.22, `rgba(${tint},.22)`);
    glow.addColorStop(1, `rgba(${tint},0)`);
    c.fillStyle = glow;
    c.fillRect(0, 0, 32, 32);
    sprites.set(tint, sprite);
  }
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const special = Math.max(1, Math.round(count * 0.05));
    const soft = Math.round(count * 0.15);
    for (let i = 0; i < count; i++) {
      const p = particles[i],
        s = particleSample(p, elapsed);
      const x = p.x * width + s.dx,
        y = p.y * height + s.dy;
      const highlight = i < special,
        halo = i < special + soft;
      ctx.globalAlpha = s.alpha + (highlight ? s.sparkle * 0.24 : 0);
      if (halo) {
        const sprite = sprites.get(p.tint);
        const size = highlight ? 4.8 : 3.8;
        if (sprite) ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.fillStyle = `rgb(${p.tint})`;
      ctx.beginPath();
      ctx.arc(x, y, p.radius * (highlight ? 1.2 : 1), 0, Math.PI * 2);
      ctx.fill();
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
