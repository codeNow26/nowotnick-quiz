import { useEffect, useRef } from "react";
import { startParticleCanvas } from "@/lib/ambient-particles";

export function AmbientStars() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => (canvas.current ? startParticleCanvas(canvas.current) : undefined), []);
  return <canvas ref={canvas} className="ambient-stars" aria-hidden="true" />;
}
