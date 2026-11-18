import { useEffect, useRef, useState } from "react";
import { Clapperboard, Play, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BenniClip } from "@/lib/benni-clips";

interface ControlsProps {
  clips: BenniClip[];
  disabled?: boolean;
  onPlay: (clip: BenniClip) => void;
  onRandom: () => void;
}

export function BenniClipControls({ clips, disabled = false, onPlay, onRandom }: ControlsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!clips.length) return null;
  return (
    <div className="relative" ref={menuRef}>
      <Button type="button" disabled={disabled} aria-expanded={open} aria-haspopup="dialog"
        className="glass rounded-xl border-white/15 text-foreground hover:bg-primary hover:text-primary-foreground"
        onClick={() => setOpen(value => !value)}>
        <Clapperboard className="mr-2 h-4 w-4" /> Benni-TV
      </Button>
      {open && !disabled && (
        <div role="dialog" aria-label="Benni-Einspieler auswählen"
          className="absolute right-0 top-full z-[90] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-primary/30 bg-[#1c1733] p-3 text-white shadow-[0_20px_55px_rgba(0,0,0,.65)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#e8dffb]">Benni-Momente</span>
            <button type="button" className="rounded-lg p-1.5 text-[#bdb2d7] hover:bg-white/10"
              aria-label="Auswahl schließen" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {clips.map(clip => (
              <button type="button" key={clip.id}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => { setOpen(false); onPlay(clip); }}>
                <Play className="h-4 w-4 shrink-0 text-[#bdabf4]" />
                <span className="min-w-0 flex-1 truncate">{clip.title || "Benni-Moment"}</span>
              </button>
            ))}
          </div>
          <Button type="button" className="mt-3 w-full rounded-xl" variant="outline"
            onClick={() => { setOpen(false); onRandom(); }}>
            <Shuffle className="mr-2 h-4 w-4" /> Zufälliger Benni-Moment
          </Button>
        </div>
      )}
    </div>
  );
}

interface PlayerProps {
  clip: BenniClip;
  onClose: () => void;
}

/** Covers the quiz temporarily, without changing its score or the selected question. */
export function BenniClipPlayer({ clip, onClose }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    const video = videoRef.current;
    // Autoplay with sound can be blocked on some browsers; show a manual play button.
    const playback = video?.play();
    if (playback) void playback.catch(() => setNeedsTap(true));
    return () => {
      window.removeEventListener("keydown", escape);
      video?.pause();
    };
  }, [clip.url, onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Benni-TV: ${clip.title}`}
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/95 p-3 backdrop-blur-xl sm:p-8">
      <button type="button" onClick={onClose} aria-label="Video schließen"
        className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/70 p-3 text-white hover:bg-white/15">
        <X className="h-6 w-6" />
      </button>
      <div className="relative flex max-h-[90dvh] w-full max-w-6xl items-center justify-center">
        <video ref={videoRef} key={clip.url} src={clip.url} autoPlay controls playsInline preload="auto"
          aria-label={clip.title}
          className="max-h-[88dvh] w-full rounded-xl bg-black object-contain"
          onPlaying={() => setNeedsTap(false)}
          onEnded={onClose}
          onError={() => { setFailed(true); setNeedsTap(false); }} />
        {needsTap && !failed && (
          <Button type="button" size="lg" className="absolute inset-0 m-auto h-16 w-fit rounded-2xl px-8 shadow-2xl"
            onClick={() => void videoRef.current?.play().catch(() => setNeedsTap(true))}>
            <Play className="mr-2 h-5 w-5" /> Video abspielen
          </Button>
        )}
        {failed && <div role="alert" className="absolute inset-x-3 bottom-5 rounded-xl border border-amber-400/30 bg-black/90 p-4 text-center text-amber-100">
          Video konnte nicht geladen werden. Bitte MP4 mit H.264/AAC verwenden.
          <Button type="button" variant="outline" className="ml-3" onClick={onClose}>Zurück zum Quiz</Button>
        </div>}
      </div>
    </div>
  );
}
