import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Clapperboard, Play, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BenniClip } from "@/lib/benni-clips";
import { connectBenniAudio, disconnectBenniAudio } from "@/lib/benni-audio";

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

/** A short show interlude; the parent restores music after the exit fade. */
export function BenniClipPlayer({ clip, onClose }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const [aspect, setAspect] = useState(16 / 9);
  const title = clip.title.trim();

  const close = useCallback(() => {
    videoRef.current?.pause();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(onClose, reducedMotion ? 0 : 220);
    return () => window.clearTimeout(timeout);
  }, [open, onClose]);

  // Set up the gain stage before starting the media. A phone click cannot
  // grant autoplay permission on another device, so offer a local play fallback.
  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    if (videoRef.current) {
      videoRef.current.pause();
      disconnectBenniAudio(videoRef.current);
    }
    videoRef.current = video;
    audioContextRef.current = video ? connectBenniAudio(video) : null;
    if (!video) return;
    if (audioContextRef.current?.state === "suspended") {
      setNeedsTap(true);
      return;
    }
    void video.play().catch(() => {
      if (videoRef.current === video) setNeedsTap(true);
    });
  }, []);

  const startWithTap = () => {
    const video = videoRef.current;
    if (!video) return;
    const context = audioContextRef.current;
    // Both calls happen directly inside the local click gesture.
    const resume = context?.state === "suspended" ? context.resume() : Promise.resolve();
    const start = video.play();
    void Promise.all([resume, start]).then(() => {
      if (videoRef.current !== video) return;
      if (context && context.state !== "running") {
        video.pause();
        setNeedsTap(true);
        return;
      }
      setNeedsTap(false);
    }).catch(() => {
      if (videoRef.current === video) {
        video.pause();
        setNeedsTap(true);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={next => { if (!next) close(); }}>
      <Dialog.Portal container={typeof document !== "undefined" ? document.fullscreenElement : undefined}>
        <Dialog.Overlay className="benni-show-backdrop" />
        <Dialog.Content
          ref={dialogRef}
          className="benni-show"
          onOpenAutoFocus={event => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            dialogRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            returnFocusRef.current?.focus({ preventScroll: true });
          }}
          onClick={event => { if (event.target === event.currentTarget) close(); }}
        >
          <Dialog.Title className="sr-only">Benni-Moment{title && ` · ${title}`}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Kurzer Quiz-Einspieler. Mit Escape oder einem Klick neben das Video überspringen.
          </Dialog.Description>
          <button type="button" onClick={close} aria-label="Einspieler überspringen" className="benni-show-close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="benni-show-stage" style={{ "--benni-aspect": aspect } as CSSProperties}>
            <video
              ref={attachVideo}
              key={clip.url}
              crossOrigin="anonymous"
              src={clip.url}
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              aria-label={title || "Benni-Moment"}
              onLoadedMetadata={event => {
                const video = event.currentTarget;
                if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
              }}
              onPlaying={() => {
                setStarted(true);
                setNeedsTap(audioContextRef.current?.state === "suspended");
              }}
              onEnded={close}
              onError={() => { setFailed(true); setNeedsTap(false); }}
            />
            {started && !failed && (
              <div className="benni-show-caption" aria-hidden="true">
                <span className="benni-show-label">Benni-Moment</span>
                {title && title !== "Benni-Moment" && <span className="benni-show-title">{title}</span>}
              </div>
            )}
            {open && needsTap && !failed && (
              <button
                type="button"
                className="benni-show-play"
                aria-label="Benni-Moment abspielen"
                onClick={startWithTap}
              >
                <Play className="h-6 w-6" fill="currentColor" aria-hidden="true" />
              </button>
            )}
            {failed && (
              <div role="alert" className="benni-show-error">
                <p>Dieser Einspieler konnte nicht geladen werden.</p>
                <button type="button" onClick={close}>Zurück zum Quiz</button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
