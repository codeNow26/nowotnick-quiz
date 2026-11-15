import { AmbientVeils } from "./AmbientVeils";
import { useEffect, useRef } from "react";
import { startParticleCanvas } from "@/lib/ambient-particles";

export function AmbientStars() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const aurora = useRef<HTMLCanvasElement>(null);
  useEffect(
    () => (canvas.current ? startParticleCanvas(canvas.current, aurora.current) : undefined),
    [],
  );
  return (
    <>
      <AmbientVeils canvasRef={aurora} />
      <canvas ref={canvas} className="ambient-stars" aria-hidden="true" />
    </>
  );
}
