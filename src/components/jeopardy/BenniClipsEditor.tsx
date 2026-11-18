import { useRef, useState } from "react";
import { ChevronDown, Clapperboard, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_BENNI_CLIPS, titleForVideo, type BenniClip } from "@/lib/benni-clips";
import { uploadQuizVideo } from "@/lib/quiz-video";

interface Props {
  quizId: string;
  clips: BenniClip[];
  onChange: (clips: BenniClip[]) => void;
  onPending: (pending: boolean) => void;
}

export function BenniClipsEditor({ quizId, clips, onChange, onPending }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const upload = async (file?: File) => {
    if (!file || inFlight.current || clips.length >= MAX_BENNI_CLIPS) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    onPending(true);
    try {
      const url = await uploadQuizVideo(quizId, file);
      const clip: BenniClip = { id: crypto.randomUUID(), title: titleForVideo(file.name), url };
      onChange([...clips, clip]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video konnte nicht hochgeladen werden.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      onPending(false);
    }
  };

  return (
    <details className="group mb-4 rounded-3xl border border-primary/20 bg-primary/[.035] p-4 md:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <Clapperboard className="h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block font-display text-lg text-foreground">Benni-TV</span>
            <span className="block text-xs text-muted-foreground">
              {clips.length ? `${clips.length} Einspieler gespeichert` : "Spontane Videoeinspieler während des Spiels"}
            </span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">MP4 oder WebM, maximal 50 MB pro Video. Ideal: 5–15 Sekunden.</p>
          <Button type="button" variant="outline" disabled={busy || clips.length >= MAX_BENNI_CLIPS}
            className="rounded-xl border-primary/30" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {busy ? "Lädt hoch …" : "Video hinzufügen"}
          </Button>
          <input ref={inputRef} type="file" className="sr-only" accept="video/mp4,video/webm"
            disabled={busy || clips.length >= MAX_BENNI_CLIPS}
            onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; void upload(file); }} />
        </div>
        {busy && <p role="status" className="text-xs text-amber-200">Video wird hochgeladen. Bitte den Editor geöffnet lassen.</p>}
        {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
        {clips.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-muted-foreground">
          Noch keine Einspieler. Lade deine kurzen Benni-Clips hoch.
        </p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {clips.map(clip => (
            <div key={clip.id} className="min-w-0 space-y-2 rounded-xl border border-white/10 bg-background/40 p-3">
              <video src={clip.url} controls playsInline preload="metadata" aria-label={`Vorschau: ${clip.title}`}
                className="aspect-video w-full rounded-lg bg-black object-contain" />
              <div className="flex items-center gap-2">
                <Input aria-label="Titel des Einspielers" value={clip.title} maxLength={70} disabled={busy}
                  onChange={e => onChange(clips.map(item => item.id === clip.id ? { ...item, title: e.target.value } : item))}
                  className="h-10 min-w-0 rounded-lg border-white/15 bg-white/[.035]" />
                <Button type="button" variant="ghost" size="icon" title="Einspieler aus diesem Quiz entfernen"
                  aria-label={`${clip.title} entfernen`} disabled={busy}
                  onClick={() => onChange(clips.filter(item => item.id !== clip.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Videos sind über ihren Link öffentlich abrufbar. Entfernen löscht nur die Zuordnung zum Quiz.
          Während des Spiels kannst du die Clips manuell oder zufällig auslösen.
        </p>
      </div>
    </details>
  );
}
