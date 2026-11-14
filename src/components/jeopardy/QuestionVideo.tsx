import { useEffect, useState } from 'react';

export function QuestionVideo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className="my-4">
    <video key={src} src={src} controls playsInline preload="metadata" aria-label="Video zur Frage"
      className="mx-auto max-h-[40vh] w-full rounded-xl border border-white/15 bg-black object-contain"
      onError={() => setFailed(true)} />
    {failed && <p role="alert" className="mt-2 text-sm text-amber-200">Video konnte nicht geladen oder abgespielt werden. Bitte die Verbindung prüfen; MP4 mit H.264/AAC ist am kompatibelsten.</p>}
  </div>;
}
