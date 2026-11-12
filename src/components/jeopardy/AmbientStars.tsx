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
    size: index % 7 === 0 ? 2 : 1.25,
    opacity: 0.3 + random() * 0.35,
    dx: (random() - 0.5) * 48,
    dy: (random() - 0.5) * 56,
    duration: 17 + random() * 19,
    delay: -random() * 36,
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
          style={{
            left: star.x + "%",
            top: star.y + "%",
            width: star.size,
            height: star.size,
            "--star-opacity": star.opacity,
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
