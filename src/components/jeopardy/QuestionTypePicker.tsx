import { useState } from "react";
import { Check, ChevronDown, Grid2X2, Lightbulb, ListOrdered, MessageSquareText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Question } from "@/lib/jeopardy-data";

type QuestionType = NonNullable<Question["type"]>;

const types = [
  { id: "normal", label: "Normal", subtitle: "Klassische Frage mit freier Antwort", icon: MessageSquareText },
  { id: "choice", label: "ABCD", subtitle: "Vier Möglichkeiten, eine richtige Antwort", icon: Grid2X2 },
  { id: "hint", label: "Hinweise", subtitle: "Tipps freischalten, Punkte reduzieren", icon: Lightbulb },
  { id: "order", label: "Reihenfolge", subtitle: "Elemente in die richtige Ordnung bringen", icon: ListOrdered },
] as const;

interface Props {
  value: Question["type"];
  disabled?: boolean;
  onChange: (type: QuestionType) => void;
}

export function QuestionTypePicker({ value, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = types.find(item => item.id === value) ?? types[0];
  const CurrentIcon = current.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Fragetyp auswählen. Aktuell: ${current.label}`}
          className="quiz-type-trigger group inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.075] px-3.5 text-sm text-foreground/85 transition-[border-color,background-color,color] duration-300 hover:border-primary/45 hover:bg-primary/[0.13] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <CurrentIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-semibold">{current.label}</span>
          <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-y-[1px]" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="quiz-type-dialog w-[min(92vw,690px)] !max-w-[690px] max-h-[min(88dvh,720px)] overflow-y-auto rounded-[26px] border border-white/[0.16] bg-[#100f27]/95 p-5 shadow-[0_26px_110px_rgba(0,0,0,.60)] backdrop-blur-2xl sm:p-7">
        <div className="space-y-2 pr-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">Frageneditor</p>
          <DialogTitle className="font-display text-xl font-semibold tracking-wide text-foreground sm:text-2xl">
            Fragetyp auswählen
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Wie soll diese Frage gespielt werden? Bilder, Videos und Audio funktionieren unabhängig davon.
          </DialogDescription>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {types.map((type, index) => {
            const Icon = type.icon;
            const selected = type.id === current.id;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={selected}
                onClick={() => { if (!selected) onChange(type.id); setOpen(false); }}
                className={`quiz-type-tile group relative min-h-[132px] overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                  ${selected
                    ? "border-primary/60 bg-primary/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_38px_-26px_rgba(150,118,255,.38)]"
                    : "border-white/[0.10] bg-white/[0.035] hover:border-primary/35 hover:bg-white/[0.075]"}`}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${selected ? "border-primary/40 bg-primary/20 text-primary" : "border-white/10 bg-white/[0.05] text-foreground/70 group-hover:text-primary"}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {selected && <Check className="h-5 w-5 text-primary" aria-label="Ausgewählt" />}
                </div>
                <p className="mt-3 font-display text-base font-semibold text-foreground">{type.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{type.subtitle}</p>
              </button>
            );
          })}
        </div>
        <p className="pt-1 text-center text-[11px] text-muted-foreground/70">
          Weitere Fragetypen können später ergänzt werden. Spezialfunktionen bleiben vorerst außen vor.
        </p>
      </DialogContent>
    </Dialog>
  );
}
