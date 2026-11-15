import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface SelectionTrackProps {
  value: number;
  className: string;
  children: ReactNode;
}

interface TrackBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single highlight follows the chosen button, including wrapped layouts.
 * ResizeObserver is installed only once; a value change never reinstalls it
 * and therefore cannot interrupt an in-flight GSAP tween with a snap.
 */
export function SelectionTrack({ value, className, children }: SelectionTrackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const positioned = useRef(false);
  const selectedValue = useRef(value);
  const lastBounds = useRef<TrackBounds | null>(null);
  selectedValue.current = value;

  const position = useCallback((animated: boolean) => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) return;

    const active = Array.from(root.querySelectorAll<HTMLElement>("[data-selection-value]"))
      .find(button => button.dataset.selectionValue === String(selectedValue.current));
    if (!active) return;

    const next: TrackBounds = {
      x: active.offsetLeft,
      y: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    };
    const previous = lastBounds.current;
    if (previous && Object.keys(next).every(key =>
      previous[key as keyof TrackBounds] === next[key as keyof TrackBounds]
    )) return;
    lastBounds.current = next;

    if (animated && positioned.current &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(indicator, {
        ...next,
        duration: 0.46,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    } else {
      gsap.killTweensOf(indicator);
      gsap.set(indicator, next);
    }
    positioned.current = true;
  }, []);

  useLayoutEffect(() => {
    position(true);
  }, [value, position]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => position(false));
    observer.observe(root);
    return () => observer.disconnect();
  }, [position]);

  useEffect(() => {
    const indicator = indicatorRef.current;
    return () => { if (indicator) gsap.killTweensOf(indicator); };
  }, []);

  return (
    <div ref={rootRef} className={`quiz-selection-track relative isolate ${className}`}>
      <span ref={indicatorRef} className="quiz-selection-glider" aria-hidden="true" />
      {children}
    </div>
  );
}
