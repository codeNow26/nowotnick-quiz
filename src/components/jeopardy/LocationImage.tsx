import { useState, type KeyboardEvent } from "react";
import type { ImagePoint } from "@/lib/question-formats";

interface Props {
  src: string;
  target?: ImagePoint;
  guess?: ImagePoint;
  radius: number;
  onPick?: (point: ImagePoint, aspect: number) => void;
  label: string;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function LocationImage({ src, target, guess, radius, onPick, label }: Props) {
  const [aspect, setAspect] = useState(0);
  const [failed, setFailed] = useState(false);
  const [w, h] = [Math.max(1, aspect) * 100, Math.max(1, 1 / (aspect || 1)) * 100];
  function keyPick(event: KeyboardEvent<HTMLButtonElement>) {
    if (!onPick || !aspect) return;
    const point = guess ?? target ?? { x: 0.5, y: 0.5 };
    const amount = event.shiftKey ? 0.05 : 0.01;
    const keys: Record<string, [number, number]> = {
      ArrowLeft: [-amount, 0],
      ArrowRight: [amount, 0],
      ArrowUp: [0, -amount],
      ArrowDown: [0, amount],
    };
    const delta = keys[event.key];
    if (!delta) return;
    event.preventDefault();
    onPick({ x: clamp(point.x + delta[0]), y: clamp(point.y + delta[1]) }, aspect);
  }
  return (
    <div className="space-y-2 text-center">
      <div
        className="relative mx-auto overflow-hidden rounded-xl"
        style={{ width: aspect ? `min(100%, ${aspect * 42}dvh)` : "100%" }}
      >
        <img
          src={src}
          alt={label}
          className="block h-auto w-full"
          onLoad={(e) => {
            setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
            setFailed(false);
          }}
          onError={() => setFailed(true)}
        />
        {aspect > 0 && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${w} ${h}`}
          >
            {target && (
              <g stroke="#79e3d9">
                <circle
                  cx={target.x * w}
                  cy={target.y * h}
                  r={radius}
                  fill="#52cdbb"
                  fillOpacity=".18"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={target.x * w}
                  cy={target.y * h}
                  r="1.2"
                  fill="#76e9d9"
                  stroke="#172338"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}
            {guess && (
              <g transform={`translate(${guess.x * w} ${guess.y * h})`}>
                <circle
                  r="1.7"
                  fill="#302344"
                  stroke="#fff"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle r="1.15" fill="#ffc076" />
              </g>
            )}
          </svg>
        )}
        {onPick && !failed && (
          <button
            type="button"
            disabled={!aspect}
            aria-label={label + " – Position setzen, mit Pfeiltasten verschieben"}
            className="absolute inset-0 cursor-crosshair rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            onKeyDown={keyPick}
            onClick={(e) => {
              if (!e.detail) {
                onPick(guess ?? target ?? { x: 0.5, y: 0.5 }, aspect);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              onPick(
                {
                  x: clamp((e.clientX - rect.left) / rect.width),
                  y: clamp((e.clientY - rect.top) / rect.height),
                },
                aspect,
              );
            }}
          />
        )}
      </div>
      {failed && <p role="alert">Das Bild konnte nicht geladen werden.</p>}
      {(target || guess) && (
        <p className="flex justify-center gap-4 text-xs">
          <span className="text-amber-200">{guess && "● Tipp"}</span>
          <span className="text-teal-200">{target && "◎ Ziel und Trefferbereich"}</span>
        </p>
      )}
    </div>
  );
}
