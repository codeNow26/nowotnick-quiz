import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface SelectionTrackProps {
  value: number;
  className: string;
  children: ReactNode;
}

/** One shared indicator follows the selected button through rows and wraps.
 * The buttons keep their native accessible focus, click and pressed states.
 */
export function SelectionTrack({ value, className, children }: SelectionTrackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const positioned = useRef(false);

  const position = useCallback((animated: boolean) => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) return;

    const active = Array.from(root.querySelectorAll<HTMLElement>("[data-selection-value]"))
      .find(button => button.dataset.selectionValue === String(value));
    if (!active) return;

    // offsetLeft/Top are already relative to the positioned track. Unlike
    // boundingClientRect they are unaffected by the start screen's own entrance.
    const bounds = {
      x: active.offsetLeft,
      y: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    };
    const canAnimate = animated && positioned.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (canAnimate) {
      gsap.to(indicator, {
        ...bounds,
        duration: 0.48,
        ease: "power3.inOut",
        overwrite: true,
      });
    } else {
      gsap.set(indicator, bounds);
    }
    positioned.current = true;
  }, [value]);

  useLayoutEffect(() => {
    position(true);
  }, [position]);

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
