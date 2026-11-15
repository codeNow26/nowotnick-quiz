import { useId, useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { gsap } from "gsap";

/** Two tapered orbit trails leave a common point just above the board. */
export function GameStartLight() {
  const id = useId();
  return (
    <div className="quiz-intro-fx" aria-hidden="true">
      <svg viewBox="0 0 960 160" preserveAspectRatio="none" focusable="false">
        <defs>
          <radialGradient id={`${id}-dawn`}>
            <stop stopColor="#e8e2ff" stopOpacity=".8" />
            <stop offset=".12" stopColor="#b8b0ff" stopOpacity=".5" />
            <stop offset=".42" stopColor="#9183ec" stopOpacity=".23" />
            <stop offset="1" stopColor="#6457bd" stopOpacity="0" />
          </radialGradient>
          {["ice", "violet"].map((color) => (
            <linearGradient key={color} id={`${id}-${color}`}>
              <stop stopColor="#746bdc" stopOpacity="0" />
              <stop
                offset=".37"
                stopColor={color === "ice" ? "#899ee8" : "#a784e7"}
                stopOpacity=".35"
              />
              <stop
                offset=".78"
                stopColor={color === "ice" ? "#bbdfff" : "#d7b5fa"}
                stopOpacity=".84"
              />
              <stop offset="1" stopColor="#edf3ff" />
            </linearGradient>
          ))}
        </defs>
        <g transform="translate(480 82)">
          <g className="quiz-launch-dawn" opacity="0">
            <ellipse rx="207" ry="32" fill={`url(#${id}-dawn)`} />
            <ellipse rx="83" ry="2.8" fill={`url(#${id}-dawn)`} />
          </g>
          {[false, true].map((left) => (
            <g key={String(left)} transform={left ? "scale(-1 1) rotate(-3)" : "rotate(-5)"}>
              <g className="quiz-launch-trail" opacity="0">
                <path
                  d="M-227 20 C-155 32 -66 -7 0 0 C-66 -3 -133 37 -227 20Z"
                  fill={`url(#${id}-${left ? "violet" : "ice"})`}
                />
                <path
                  d="M-183 29 C-117 29 -69 1 -13 1"
                  fill="none"
                  stroke={`url(#${id}-${left ? "violet" : "ice"})`}
                  strokeWidth=".8"
                  opacity=".55"
                />
                <ellipse rx="15" ry="4.8" fill={`url(#${id}-dawn)`} />
                <ellipse rx="2" ry="1" fill="#e8f1ff" />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export function useGameStartAnimation(
  entering: boolean,
  setEntering: Dispatch<SetStateAction<boolean>>,
) {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!entering || !stage) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setEntering(false);
    if (motion.matches) {
      finish();
      return;
    }

    const players = Array.from(stage.querySelectorAll<HTMLElement>(".quiz-player-card"));
    const headers = Array.from(stage.querySelectorAll<HTMLElement>(".quiz-category-card"));
    const questions = Array.from(stage.querySelectorAll<HTMLElement>(".quiz-question-card"));
    const viewport = stage.querySelector(".quiz-board-viewport");
    if (!viewport || !headers.length || !questions.length) {
      finish();
      return;
    }

    document.documentElement.classList.add("quiz-launch-scroll-lock");
    // Center the wave on the visible board, even when ten columns scroll on a phone.
    const board = viewport.getBoundingClientRect();
    const center = board.left + board.width / 2;
    const columnDistance = headers.map((header) => {
      const rect = header.getBoundingClientRect();
      return Math.min(
        1,
        Math.abs(rect.left + rect.width / 2 - center) / Math.max(1, board.width / 2),
      );
    });
    const lastRow = Math.max(1, Math.ceil(questions.length / headers.length) - 1);
    const context = gsap.context(() => {
      const sequence = gsap.timeline({ onComplete: finish });
      const dawn = stage.querySelector(".quiz-launch-dawn");
      const trails = stage.querySelectorAll(".quiz-launch-trail");
      if (dawn && trails.length) {
        // Independent motion and exposure tracks let the tails fade while still travelling.
        sequence
          .fromTo(
            dawn,
            { scaleX: 0.16, scaleY: 0.54, transformOrigin: "50% 50%" },
            { scaleX: 1.27, scaleY: 0.85, duration: 0.61, ease: "power2.out" },
            0,
          )
          .to(dawn, { opacity: 0.82, duration: 0.13, ease: "sine.inOut" }, 0)
          .to(dawn, { opacity: 0, duration: 0.46, ease: "sine.inOut" }, 0.13);
        trails.forEach((trail, i) => {
          const at = 0.045 + i * 0.035;
          sequence
            .fromTo(
              trail,
              { x: 0, y: 0, scaleX: 0.1, scaleY: 0.55, transformOrigin: "98% 50%" },
              {
                x: i ? 397 : 428,
                y: i ? -2 : -4,
                scaleX: 1.18,
                scaleY: 1,
                duration: 0.64,
                ease: "power1.out",
              },
              at,
            )
            .to(trail, { opacity: 0.92, duration: 0.13, ease: "sine.inOut" }, at)
            .to(trail, { opacity: 0, duration: 0.37, ease: "sine.inOut" }, at + 0.27);
        });
      }

      sequence
        .from(stage.querySelector("header"), { opacity: 0, y: 4, duration: 0.24 }, 0)
        .from(
          players,
          { autoAlpha: 0, y: 7, duration: 0.31, ease: "power2.out", stagger: { amount: 0.09 } },
          0.015,
        )
        .from(
          headers,
          {
            autoAlpha: 0,
            y: 9,
            duration: 0.35,
            ease: "power2.out",
            stagger: (i: number) => columnDistance[i] * 0.14,
          },
          0.09,
        )
        .from(
          questions,
          {
            autoAlpha: 0,
            y: 12,
            scale: 0.985,
            duration: 0.37,
            ease: "power2.out",
            stagger: (i: number) =>
              columnDistance[i % headers.length] * 0.13 +
              (Math.floor(i / headers.length) / lastRow) * 0.19,
          },
          0.16,
        );
    }, stage);

    const motionChanged = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", motionChanged);
    return () => {
      motion.removeEventListener("change", motionChanged);
      context.revert();
      document.documentElement.classList.remove("quiz-launch-scroll-lock");
    };
  }, [entering, setEntering]);

  return stageRef;
}
