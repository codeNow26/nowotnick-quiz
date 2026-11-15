import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { gsap } from "gsap";

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
    // Schedule the reflection across the part of the header row that is on screen.
    const board = viewport.getBoundingClientRect();
    const phases = headers.map((header) => {
      const rect = header.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(1, (rect.left + rect.width / 2 - board.left) / Math.max(board.width, 1)),
      );
    });
    const lastRow = Math.max(1, Math.ceil(questions.length / headers.length) - 1);
    const context = gsap.context(() => {
      const sequence = gsap.timeline({ onComplete: finish });
      // Reveal the board as one surface first. The rows settle a few pixels later.
      sequence
        .from(stage.querySelector("header"), { opacity: 0, y: 3, duration: 0.23 }, 0)
        .from(
          players,
          { opacity: 0, y: 4, duration: 0.26, stagger: { amount: 0.055 }, ease: "power2.out" },
          0,
        )
        .from(viewport, { opacity: 0, duration: 0.24, ease: "sine.out" }, 0)
        .from(headers, { y: 3, duration: 0.27, ease: "power2.out" }, 0.02)
        .from(
          questions,
          {
            opacity: 0.62,
            y: 5,
            duration: 0.33,
            ease: "power2.out",
            stagger: (i: number) =>
              (0.15 * Math.floor(i / headers.length)) / lastRow +
              0.022 * phases[i % headers.length],
          },
          0.045,
        );

      headers.forEach((header, i) => {
        const glint = header.querySelector(".quiz-launch-edge");
        if (!glint) return;
        const at = 0.07 + 0.27 * phases[i];
        sequence
          .fromTo(glint, { xPercent: -18 }, { xPercent: 20, duration: 0.4, ease: "sine.inOut" }, at)
          .to(glint, { opacity: 1, duration: 0.14, ease: "sine.inOut" }, at)
          .to(glint, { opacity: 0, duration: 0.26, ease: "sine.inOut" }, at + 0.14);
      });
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
