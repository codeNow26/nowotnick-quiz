import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fullscreen the document root, not just the board: Radix dialogs and image
 * lightboxes portal to document.body and must stay inside the fullscreen tree.
 * Browsers own ESC, and fullscreenchange keeps the button in sync with it.
 */
export function FullscreenButton() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(
      typeof document.documentElement.requestFullscreen === "function" &&
      typeof document.exitFullscreen === "function"
    );
    const sync = () => {
      setActive(Boolean(document.fullscreenElement));
      setPending(false);
      setError("");
    };
    const onError = () => {
      setPending(false);
      setError("Der Browser hat den Vollbildmodus nicht erlaubt.");
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("fullscreenerror", onError);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("fullscreenerror", onError);
    };
  }, []);

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        // Keep the synchronous user-gesture chain intact for browser security.
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setPending(false);
      setError("Vollbild ist in diesem Browser gerade nicht möglich.");
    }
  };

  if (!supported) return null;

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={active ? "Vollbild verlassen" : "Vollbild einschalten"}
        aria-pressed={active}
        title={active ? "Vollbild verlassen (Esc)" : "Vollbild einschalten"}
        disabled={pending}
        onClick={() => void toggle()}
        className={`quiz-fullscreen-button h-11 w-11 rounded-full backdrop-blur-md transition-[background-color,border-color,box-shadow,color] duration-300
          ${active
            ? "border-primary/65 bg-primary/20 text-primary shadow-[0_0_20px_-10px_var(--indigo-glow)] hover:bg-primary/30"
            : "border-primary/50 bg-background/70 text-primary hover:border-primary/75 hover:bg-primary/15"}`}
      >
        <span key={active ? "active" : "inactive"} className="quiz-fullscreen-icon">
          {active ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
        </span>
      </Button>
      {error && (
        <p role="alert" className="absolute right-0 top-12 z-[70] w-52 rounded-xl border border-white/15 bg-background/95 p-2.5 text-xs text-foreground shadow-xl">
          {error}
        </p>
      )}
    </div>
  );
}
