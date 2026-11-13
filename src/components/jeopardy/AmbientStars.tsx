import { useEffect, useRef, type CSSProperties } from "react";

// Fixed seed keeps server and browser markup identical.
function makeStars() {
  let seed = 7319;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 32 }, (_, index) => ({
    id: index,
    x: 3 + random() * 94,
    y: 3 + random() * 94,
    size: index % 9 === 0 ? 2.2 : .9 + random() * .6,
    twinkle: index % 9 === 0,
    glint: index % 18 === 0,
    drift: index % 9 === 5,
    opacity: 0.3 + random() * 0.35,
    dx: (random() - 0.5) * 10,
    dy: (random() - 0.5) * 12,
    duration: index % 9 === 0 ? 40 : 55 + random() * 23,
    delay: index % 9 === 0 ? -(index / 9) * 10 : -random() * 60,
  }));
}
const stars = makeStars();

export function AmbientStars() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      if (layer.current) layer.current.dataset.paused = String(document.hidden);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return (
    <div ref={layer} className="ambient-stars" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="ambient-star"
          data-twinkle={star.twinkle || undefined}
          data-glint={star.glint || undefined}
          data-drift={star.drift || undefined}
          style={{
            left: star.x + "%",
            top: star.y + "%",
            width: star.size,
            height: star.size,
            "--star-opacity": star.opacity,
            "--star-delay": star.delay + "s",
            "--star-dx": star.dx + "px",
            "--star-dy": star.dy + "px",
            animationDuration: star.duration + "s",
            animationDelay: star.delay + "s",
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
