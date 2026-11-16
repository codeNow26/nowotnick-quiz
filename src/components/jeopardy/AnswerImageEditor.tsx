import { useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnswerImageEditorProps {
  value?: string;
  busy: boolean;
  onChange: (url: string) => void;
  onUpload: (file?: File) => void;
}

/** Optional, collapsible control; nothing extra is shown for questions
 * without an answer image. Upload uses the existing quiz image pipeline.
 */
export function AnswerImageEditor({ value, busy, onChange, onUpload }: AnswerImageEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const hasImage = Boolean(value?.trim());
  const isUploaded = value?.startsWith("data:image/") ?? false;

  return (
    <section className="space-y-2">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(open => !open)}
        className={`inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors duration-200
          ${hasImage
            ? "border border-primary/20 bg-primary/[0.04] text-foreground/80 hover:bg-primary/[0.08]"
            : "border border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground"}`}
      >
        <ImagePlus className="h-4 w-4 shrink-0" />
        {hasImage ? "Bild zur Antwort vorhanden" : "Bild zur Antwort hinzufügen · optional"}
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-muted-foreground">
            Das Bild erscheint erst, wenn die Antwort aufgedeckt wird.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Bild-URL</Label>
              <Input
                type="url"
                value={isUploaded ? "" : value ?? ""}
                onChange={event => onChange(event.target.value)}
                placeholder={isUploaded ? "Eigenes Bild gespeichert – URL ersetzt es" : "https://.../bild.jpg"}
                className="mt-1 h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>
            <label className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 text-sm text-primary transition-colors hover:bg-primary/[0.12] ${busy ? "pointer-events-none opacity-60" : ""}`}>
              <Upload className="h-4 w-4 shrink-0" />
              {busy ? "Bild wird verarbeitet…" : hasImage ? "Bild ersetzen" : "Bild hochladen"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={busy}
                onChange={event => {
                  onUpload(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            JPG, PNG oder WebP · maximal 10 MB. Eigene Bilder werden automatisch verkleinert und mit dem Quiz gespeichert.
          </p>
          {hasImage && (
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={value}
                alt="Vorschau des Antwortbilds"
                referrerPolicy="no-referrer"
                className="max-h-28 max-w-44 rounded-lg border border-white/10 object-contain"
                onError={event => { event.currentTarget.style.display = "none"; }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onChange("")}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Bild entfernen
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
