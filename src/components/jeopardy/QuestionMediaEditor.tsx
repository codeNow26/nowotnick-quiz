import { useEffect, useRef, useState } from "react";
import { AudioLines, FileVideo, Image as ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionVideo } from "./QuestionVideo";
import { uploadQuizAudio, uploadQuizVideo } from "@/lib/quiz-video";

type MediaKind = "image" | "video" | "audio";
interface Props {
  quizId: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  onImageUpload: (file: File) => Promise<void>;
  onChangeImage: (url: string) => void;
  onChangeVideo: (url: string) => void;
  onChangeAudio: (url: string) => void;
  onPending: (pending: boolean) => void;
}

const fileTypes = [
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/wave",
];
const extensions: Record<string, MediaKind> = {
  jpg: "image", jpeg: "image", png: "image", webp: "image",
  mp4: "video", webm: "video",
  mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio",
};

function fileKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return extensions[ext] ?? null;
}

function urlKind(url: string): MediaKind | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";
    return extensions[ext] ?? null;
  } catch {
    return null;
  }
}

/** One chooser for all three file kinds. Existing image + video combinations
 * remain valid; adding new media never silently deletes older uploads. */
export function QuestionMediaEditor({
  quizId, imageUrl, videoUrl, audioUrl, onImageUpload,
  onChangeImage, onChangeVideo, onChangeAudio, onPending,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [unknownLink, setUnknownLink] = useState(false);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const pendingCallback = useRef(onPending);
  pendingCallback.current = onPending;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; pendingCallback.current(false); };
  }, []);

  const assignUrl = (kind: MediaKind, url: string) => {
    if (kind === "image") onChangeImage(url);
    else if (kind === "video") onChangeVideo(url);
    else onChangeAudio(url);
    setUrlDraft("");
    setUnknownLink(false);
    setError("");
  };

  const addLink = (override?: MediaKind) => {
    const value = urlDraft.trim();
    if (!value) return;
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError("Bitte einen direkten http- oder https-Medienlink verwenden.");
        return;
      }
    } catch {
      setError("Bitte eine gültige Medien-URL eingeben.");
      return;
    }
    const kind = override ?? urlKind(value);
    if (!kind) {
      setUnknownLink(true);
      setError("");
      return;
    }
    assignUrl(kind, value);
  };

  const upload = async (file?: File) => {
    if (!file || inFlight.current) return;
    const kind = fileKind(file);
    if (!kind || !fileTypes.includes(file.type) && file.type !== "") {
      setError("Unterstützt werden JPG, PNG, WebP, MP4, WebM, MP3, WAV, OGG und M4A.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    onPending(true);
    try {
      if (kind === "image") {
        await onImageUpload(file);
      } else if (kind === "video") {
        const url = await uploadQuizVideo(quizId, file);
        if (alive.current) onChangeVideo(url);
      } else {
        const url = await uploadQuizAudio(quizId, file);
        if (alive.current) onChangeAudio(url);
      }
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : "Die Datei konnte nicht hochgeladen werden.");
    } finally {
      inFlight.current = false;
      if (alive.current) {
        setBusy(false);
        pendingCallback.current(false);
      }
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.10] bg-black/[0.08] p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">Eine Auswahl für Bild, Video oder Audio. Der Dateityp wird automatisch erkannt.</p>
      <label className={`quiz-media-upload inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.045] px-4 text-sm font-medium text-primary transition-[background-color,border-color] duration-300 hover:border-primary/55 hover:bg-primary/[0.10] focus-within:outline-2 focus-within:outline-primary ${busy ? "pointer-events-none opacity-55" : ""}`}>
        <Upload className="h-4 w-4" />
        {busy ? "Datei wird verarbeitet …" : "Bild, Video oder Audio auswählen"}
        <input
          type="file"
          accept={fileTypes.join(",")}
          className="sr-only"
          disabled={busy}
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            void upload(file);
          }}
        />
      </label>
      <p className="text-[11px] leading-relaxed text-muted-foreground/75">
        Bilder: JPG/PNG/WebP bis 10 MB · Videos: MP4/WebM bis 50 MB · Audio: MP3/WAV/OGG/M4A/WebM bis 20 MB.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          type="url"
          value={urlDraft}
          disabled={busy}
          onChange={event => { setUrlDraft(event.target.value); setUnknownLink(false); setError(""); }}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }}
          placeholder="Oder direkten Link zu Bild, Video oder Audio einfügen"
          aria-label="Medien-URL"
          className="h-10 min-w-[180px] flex-1 rounded-xl border-white/10 bg-white/[0.035] text-xs sm:text-sm"
        />
        <Button type="button" variant="outline" size="sm" disabled={busy || !urlDraft.trim()}
          onClick={() => addLink()} className="h-10 rounded-xl border-primary/20 bg-primary/[0.08] text-primary hover:bg-primary/[0.15]">
          Hinzufügen
        </Button>
      </div>
      {unknownLink && (
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Dieser Link hat keine erkennbare Dateiendung. Was enthält er?
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { id: "image", label: "Bild", icon: ImageIcon },
              { id: "video", label: "Video", icon: FileVideo },
              { id: "audio", label: "Audio", icon: AudioLines },
            ] as const).map(item => {
              const Icon = item.icon;
              return <Button type="button" key={item.id} variant="outline" size="sm"
                onClick={() => addLink(item.id)} className="h-9 rounded-lg border-white/15">
                <Icon className="mr-1.5 h-3.5 w-3.5" />{item.label}
              </Button>;
            })}
          </div>
        </div>
      )}
      {busy && <p role="status" className="text-xs text-muted-foreground">Bitte den Editor während des Uploads geöffnet lassen.</p>}
      {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}

      {(imageUrl || videoUrl || audioUrl) && (
        <div className="space-y-3 border-t border-white/[0.09] pt-3">
          {imageUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <img src={imageUrl} alt="Bildvorschau" referrerPolicy="no-referrer"
                className="max-h-28 max-w-44 rounded-lg border border-white/10 object-contain"
                onError={event => { event.currentTarget.style.display = "none"; }} />
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/75"><ImageIcon className="h-3.5 w-3.5" /> Bild vorhanden</span>
                <Button type="button" variant="ghost" size="sm" disabled={busy}
                  onClick={() => onChangeImage("")} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Entfernen
                </Button>
              </div>
            </div>
          )}
          {videoUrl && (
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/75"><FileVideo className="h-3.5 w-3.5" /> Video vorhanden</span>
                <Button type="button" variant="ghost" size="sm" disabled={busy}
                  onClick={() => onChangeVideo("")} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Entfernen
                </Button>
              </div>
              <QuestionVideo src={videoUrl} />
            </div>
          )}
          {audioUrl && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/75"><AudioLines className="h-3.5 w-3.5" /> Audio vorhanden</span>
                <Button type="button" variant="ghost" size="sm" disabled={busy}
                  onClick={() => onChangeAudio("")} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Entfernen
                </Button>
              </div>
              <audio key={audioUrl} src={audioUrl} preload="metadata" controls aria-label="Audiovorschau" className="w-full max-w-lg" />
            </div>
          )}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground/65">
        Medien sind optional und beim Spielen direkt in der Frage sichtbar. Hochgeladene Videos und Audios sind über ihre Links öffentlich abrufbar.
      </p>
    </div>
  );
}
