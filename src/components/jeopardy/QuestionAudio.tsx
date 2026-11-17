import { useEffect, useRef, useState } from "react";
import { AudioLines } from "lucide-react";

export function QuestionAudio({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    return () => {
      audioRef.current?.pause();
    };
  }, [src]);

  return (
    <section className="quiz-question-audio my-4 mx-auto max-w-xl rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-3 text-left sm:px-4">
      <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <AudioLines className="h-4 w-4 text-primary" aria-hidden="true" />
        Audio zur Frage
      </p>
      <audio
        ref={audioRef}
        key={src}
        src={src}
        controls
        preload="metadata"
        aria-label="Audio zur Frage abspielen"
        className="h-11 w-full"
        onError={() => setFailed(true)}
      />
      {failed && (
        <p role="alert" className="mt-2 text-xs text-amber-200">
          Audio konnte nicht geladen werden. Bitte den Link oder das Dateiformat prüfen.
        </p>
      )}
    </section>
  );
}
