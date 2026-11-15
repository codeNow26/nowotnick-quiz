import { gsap } from "gsap";
import { playerColor } from "@/lib/jeopardy-data";

/** A cosmetic flight from the question's points badge to a player card.
 * The game's score state is still committed synchronously.
 */
export function animatePointFlights(amounts: number[], colors: (string | undefined)[]) {
  if (typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const badge = document.querySelector<HTMLElement>("[data-points-flight-origin]");
  if (!badge) return;
  const source = badge.getBoundingClientRect();
  const fromX = source.left + source.width / 2;
  const fromY = source.top + source.height / 2;

  amounts.forEach((amount, index) => {
    if (!amount) return;
    const target = document.querySelector<HTMLElement>(`[data-score-target="${index}"]`);
    if (!target) return;
    const destination = target.getBoundingClientRect();
    const dx = destination.left + destination.width / 2 - fromX;
    const dy = destination.top + destination.height / 2 - fromY;
    const flight = document.createElement("span");
    flight.className = "quiz-flight-points";
    flight.textContent = `${amount > 0 ? "+" : "−"}${Math.abs(amount)}`;
    flight.style.color = playerColor(index, colors[index]);
    flight.style.left = `${fromX}px`;
    flight.style.top = `${fromY}px`;
    document.body.appendChild(flight);

    gsap.timeline({ onComplete: () => flight.remove() })
      .fromTo(flight,
        { x: 0, y: 0, scale: 0.75, autoAlpha: 0 },
        { x: dx * 0.30, y: dy * 0.25 - 45, scale: 1.13, autoAlpha: 1, duration: 0.24, ease: "power2.out" },
      )
      .to(flight,
        { x: dx * 0.70, y: dy * 0.64 - 30, scale: 1.05, duration: 0.24, ease: "none" },
      )
      .to(flight,
        { x: dx, y: dy, scale: 0.30, autoAlpha: 0, duration: 0.24, ease: "power3.in" },
      );
  });
}
