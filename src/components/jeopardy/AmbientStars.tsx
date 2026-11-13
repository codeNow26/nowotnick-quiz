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
// Separate seeded animation values preserve the original particle positions.
const stars = makeStars().map((star,index) => {
  let seed=1907+index*7919;
  const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  return {...star, drift:[1,3,6].includes(index%8), soft:index%8===3,
    tint:['235 239 255','211 199 255','183 214 255'][index%3],
    twinkleDuration:7+random()*10,twinkleDelay:-random()*25,
    driftDuration:14+random()*12,driftDelay:-random()*65,
    glowDuration:29+random()*15,glowDelay:-random()*45,
    low:.22+random()*.12,high:.65+random()*.2,
    dx:(random()>.5?1:-1)*(5+random()*6),dy:(random()>.5?1:-1)*(4+random()*6),
  };
});

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
          data-soft={star.soft || undefined}
          data-glint={star.glint || undefined}
          data-drift={star.drift || undefined}
          style={{
            left: star.x + "%",
            top: star.y + "%",
            width: star.size,
            height: star.size,
            "--star-opacity": star.opacity,
            "--star-size":star.size+"px", "--star-tint":star.tint,
            "--star-low":star.low, "--star-high":star.high,
            "--twinkle-duration":star.twinkleDuration+"s", "--twinkle-delay":star.twinkleDelay+"s",
            "--drift-duration":star.driftDuration+"s", "--drift-delay":star.driftDelay+"s",
            "--glint-duration":star.glowDuration+"s", "--glint-delay":star.glowDelay+"s",
            "--star-dx": star.dx + "px",
            "--star-dy": star.dy + "px",
          } as CSSProperties}
        ><span className="ambient-star-light" /></span>
      ))}
    </div>
  );
}
