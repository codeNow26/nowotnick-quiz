import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { gsap } from "gsap";

/**
 * One-shot cinematic launch. Every tween is scoped to the game board and
 * reverted on exit, so normal hover and scoring styles remain untouched.
 */
export function useGameStartAnimation(
  entering: boolean,
  setEntering: Dispatch<SetStateAction<boolean>>,
) {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!entering || !stageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntering(false);
      return;
    }

    const stage = stageRef.current;
    // Lock the page scrollbar only for the launch; restore normal scrolling
    // immediately after the timeline or if React unmounts the game.
    document.documentElement.classList.add("quiz-launch-scroll-lock");
    const context = gsap.context(() => {
      const playerCards = gsap.utils.toArray<HTMLElement>(".quiz-player-card", stage);
      const categoryCards = gsap.utils.toArray<HTMLElement>(".quiz-category-card", stage);
      const questionCards = gsap.utils.toArray<HTMLElement>(".quiz-question-card", stage);
      const halo = stage.querySelector<HTMLElement>(".quiz-intro-halo");
      const ring = stage.querySelector<HTMLElement>(".quiz-intro-ring");

      if (!categoryCards.length || !questionCards.length || !halo || !ring) {
        setEntering(false);
        return;
      }

      const columns = categoryCards.length;
      const rows = Math.ceil(questionCards.length / columns);
      const lastWave = Math.max(1, (rows - 1) * 0.7 + (columns - 1) * 0.45);

      gsap.set(stage, { autoAlpha: 0, scale: 0.955, y: 16, transformOrigin: "center 40%" });
      gsap.set(playerCards, { autoAlpha: 0, y: -28, scale: 0.88 });
      gsap.set(categoryCards, { autoAlpha: 0, y: -47, scale: 0.90, rotationX: -25, transformPerspective: 950, transformOrigin: "50% 100%" });
      gsap.set(questionCards, {
        autoAlpha: 0,
        scale: 0.77,
        rotationX: -15,
        transformPerspective: 850,
        x: (i: number) => (i % columns - (columns - 1) / 2) * 12,
        y: (i: number) => 60 + Math.floor(i / columns) * 11,
      });
      gsap.set([halo, ring], { autoAlpha: 0 });
      gsap.set([halo, ring], { xPercent: -50, yPercent: -50 });

      const sequence = gsap.timeline({
        onComplete: () => setEntering(false),
      });

      // Stage reveal + concentrated cosmic impact.
      sequence.to(stage, {
        autoAlpha: 1, scale: 1, y: 0,
        duration: 0.55, ease: "power3.out",
      }, 0);
      sequence.fromTo(halo,
        { scale: 0.25, autoAlpha: 0 },
        { scale: 1.45, autoAlpha: 0.82, duration: 0.40, ease: "power2.out" },
        0.08,
      ).to(halo, { scale: 2.15, autoAlpha: 0, duration: 0.49, ease: "power2.in" }, 0.40);
      sequence.fromTo(ring,
        { scale: 0.18, autoAlpha: 0 },
        { scale: 1.38, autoAlpha: 0.62, duration: 0.58, ease: "power3.out" },
        0.20,
      ).to(ring, { scale: 2.25, autoAlpha: 0, duration: 0.52, ease: "power2.out" }, 0.63);

      // Scoreboard first, then headers, then diagonal wave of cards.
      sequence.to(playerCards, {
        autoAlpha: 1, y: 0, scale: 1,
        duration: 0.58, ease: "back.out(1.3)", stagger: 0.07,
      }, 0.25);
      sequence.to(categoryCards, {
        autoAlpha: 1, y: 0, scale: 1, rotationX: 0,
        duration: 0.66, ease: "back.out(1.25)",
        stagger: { amount: 0.34, from: "start" },
      }, 0.43);
      sequence.to(questionCards, {
        autoAlpha: 1, x: 0, y: 0, scale: 1, rotationX: 0,
        duration: 0.61, ease: "back.out(1.65)",
        stagger: (i: number) => {
          const row = Math.floor(i / columns);
          const column = i % columns;
          return ((row * 0.7 + column * 0.45) / lastWave) * 0.53;
        },
      }, 0.65);

      // Keep the overall rhythm without a diagonal light sweep:
      // that full-screen streak resembled tearing on some displays.
      // Keep the total duration stable regardless of the number of categories.
      sequence.to({}, { duration: 0.05 }, 1.79);
    }, stage);

    return () => {
      context.revert();
      document.documentElement.classList.remove("quiz-launch-scroll-lock");
    };
  }, [entering, setEntering]);

  return stageRef;
}
