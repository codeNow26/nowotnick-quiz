import type { Ref } from "react";

export function AmbientVeils({ canvasRef }: { canvasRef: Ref<HTMLCanvasElement> }) {
  return (
    <div aria-hidden="true" className="ambient-veils">
      <canvas ref={canvasRef} />
    </div>
  );
}
