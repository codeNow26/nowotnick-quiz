import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REVEAL_STAGES, type RevealSettings } from "@/lib/question-formats";

interface Props {
  src: string;
  video: boolean;
  method: RevealSettings["method"];
  stage: number;
  full: boolean;
  onReady: (ready: boolean) => void;
}
const pixelColumns = [6, 10, 16, 25, 40, 68, 108];

export function RevealMedia({ src, video, method, stage, full, onReady }: Props) {
  const image = useRef<HTMLImageElement>(null),
    clip = useRef<HTMLVideoElement>(null);
  const mosaic = useRef<HTMLCanvasElement>(null);
  const resolution = useRef(pixelColumns[0]);
  const [aspect, setAspect] = useState(0),
    [failed, setFailed] = useState(false),
    [playing, setPlaying] = useState(false);
  const clear = full || stage >= REVEAL_STAGES;
  const ready = (w: number, h: number) => {
    if (w && h) {
      setAspect(w / h);
      setFailed(false);
      onReady(true);
    }
  };
  const fail = () => {
    setFailed(true);
    onReady(false);
  };
  useEffect(
    () => () => {
      onReady(false);
    },
    [onReady],
  );

  // The decoder and media element survive all stages. Only the small mosaic buffer is resampled.
  useLayoutEffect(() => {
    if (method !== "mosaic" || !aspect || clear) return;
    const canvas = mosaic.current,
      source = video ? clip.current : image.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !source || !ctx) return;
    const start = resolution.current,
      end = pixelColumns[stage],
      began = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0,
      videoFrame = 0;
    function paint(now: number) {
      const t = reduced ? 1 : Math.min(1, (now - began) / 220);
      resolution.current = start + (end - start) * Math.max(0, t);
      const w = Math.max(1, Math.round(resolution.current * Math.min(1, aspect)));
      const h = Math.max(1, Math.round(resolution.current * Math.min(1, 1 / aspect)));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      ctx!.drawImage(source!, 0, 0, w, h);
      return t < 1 && start !== end;
    }
    const el = clip.current;
    const supportsFrames = !!el && typeof el.requestVideoFrameCallback === "function";
    const sample = (now: number) => {
      const changing = paint(now);
      if (changing || (el && playing && !supportsFrames)) frame = requestAnimationFrame(sample);
      else if (el && playing && supportsFrames) videoFrame = el.requestVideoFrameCallback(sample);
    };
    sample(began);
    return () => {
      cancelAnimationFrame(frame);
      if (videoFrame) el?.cancelVideoFrameCallback(videoFrame);
    };
  }, [aspect, method, clear, stage, video, playing, src]);

  return (
    <div className="space-y-2">
      <div
        className="format-reveal-frame"
        style={{ width: aspect ? `min(100%, ${aspect * 40}dvh)` : "100%" }}
      >
        <div
          className="format-reveal-source"
          style={{
            filter:
              method === "blur" && !clear ? `blur(${[20, 15, 11, 8, 5, 2.5][stage]}px)` : undefined,
          }}
        >
          {video ? (
            <video
              ref={clip}
              src={src}
              playsInline
              controls={clear}
              preload="auto"
              aria-label="Enthüllungsvideo"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onLoadedData={(e) => ready(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
              onError={fail}
            />
          ) : (
            <img
              ref={image}
              src={src}
              alt="Motiv der Enthüllungsfrage"
              onLoad={(e) => ready(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
              onError={fail}
            />
          )}
        </div>
        {method === "mosaic" && (
          <canvas
            ref={mosaic}
            aria-hidden="true"
            className="format-mosaic"
            style={{ opacity: clear ? 0 : 1 }}
          />
        )}
        {method === "tiles" && (
          <div aria-hidden="true" className="format-tiles">
            {Array.from({ length: 28 }, (_, i) => (
              <i
                key={i}
                style={{ opacity: clear || (i * 11 + 3) % 28 < (stage + 1) * 4 ? 0 : 1 }}
              />
            ))}
          </div>
        )}
      </div>
      {failed && (
        <p role="alert" className="text-amber-200">
          Das Medium konnte nicht geladen werden.
        </p>
      )}
      {video && !clear && !failed && (
        <Button
          variant="outline"
          size="sm"
          disabled={!aspect}
          onClick={() => {
            if (playing) clip.current?.pause();
            else void clip.current?.play().catch(fail);
          }}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Video pausieren" : "Video abspielen"}
        </Button>
      )}
    </div>
  );
}
