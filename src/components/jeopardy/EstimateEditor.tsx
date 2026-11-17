import { useId, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Keyboard, SlidersHorizontal, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { EstimateSettings } from "@/lib/question-formats";

interface EstimateEditorProps {
  settings: EstimateSettings;
  onChange: (changes: Partial<EstimateSettings>) => void;
}

const inputStyle =
  "quiz-number-input h-11 w-full min-w-0 rounded-xl border-white/[0.13] bg-white/[0.045] px-3.5 text-[15px] text-foreground shadow-none transition-[background-color,border-color,box-shadow] duration-200 hover:border-white/25 focus-visible:border-primary/55 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-primary/20";

const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 8 });

function ValueField({
  label, value, onChange, min, max, step = "any", className = "",
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  className?: string;
}) {
  // Preserve intermediate typing such as a trailing decimal separator.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <Input
        className={inputStyle + " " + className}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? value ?? ""}
        onChange={event => {
          setDraft(event.target.value);
          onChange(Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : undefined);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

export function EstimateEditor({ settings: s, onChange }: EstimateEditorProps) {
  const inputName = useId();
  const toleranceName = useId();
  const sliderPanelId = useId();
  const [expanded, setExpanded] = useState(false);

  const validTarget = s.target !== undefined && Number.isFinite(s.target);
  const validTolerance = Number.isFinite(s.tolerance) && s.tolerance >= 0;
  const margin = validTarget && validTolerance
    ? s.toleranceType === "percent" ? Math.abs(s.target!) * s.tolerance / 100 : s.tolerance
    : 0;
  const lower = validTarget ? s.target! - margin : 0;
  const upper = validTarget ? s.target! + margin : 0;
  const format = (value: number) => numberFormat.format(value);
  const unit = s.unit.trim();
  const rangeValid = Number.isFinite(s.min) && Number.isFinite(s.max) && s.max > s.min;
  const targetOnTrack = validTarget && rangeValid && s.target! >= s.min && s.target! <= s.max;
  const marker = targetOnTrack ? Math.max(0, Math.min(100, ((s.target! - s.min) / (s.max - s.min)) * 100)) : 0;

  return (
    <section aria-label="Einstellungen der Schätzfrage" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.10] text-primary">
            <Target className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold tracking-wide text-foreground">Schätzung</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Antwort und Spielregeln festlegen</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Automatische Wertung
        </div>
      </div>

      <div className="grid min-w-0 gap-y-6 lg:grid-cols-2 lg:gap-x-9">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-[3px] w-5 rounded-full bg-primary/65" aria-hidden="true" />
            <h4 className="text-xs font-semibold uppercase tracking-[0.13em] text-foreground/80">Die richtige Antwort</h4>
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3">
            <ValueField
              label="Zahl"
              value={s.target}
              onChange={target => onChange({ target })}
            />
            <label className="grid min-w-0 gap-1.5">
              <span className="text-xs font-medium text-foreground/70">Einheit <span className="font-normal text-muted-foreground/65">· optional</span></span>
              <Input
                value={s.unit}
                onChange={event => onChange({ unit: event.target.value })}
                placeholder="z. B. Meter"
                maxLength={32}
                className={inputStyle}
              />
            </label>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/75">
            Diese Zahl wird erst bei der Auflösung gezeigt.
          </p>
        </div>

        <div className="min-w-0 space-y-3 lg:border-l lg:border-white/[0.09] lg:pl-9">
          <div className="flex items-center gap-2">
            <span className="h-[3px] w-5 rounded-full bg-primary/65" aria-hidden="true" />
            <h4 className="text-xs font-semibold uppercase tracking-[0.13em] text-foreground/80">So wird geschätzt</h4>
          </div>
          <fieldset className="min-w-0">
            <legend className="sr-only">Eingabe im Spiel</legend>
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              {([
                { id: "number", title: "Freie Zahl", subtitle: "Ohne Vorgaben", Icon: Keyboard },
                { id: "slider", title: "Slider", subtitle: "Mit Zahlenbereich", Icon: SlidersHorizontal },
              ] as const).map(({ id, title, subtitle, Icon }) => (
                <label key={id} className="relative block min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name={inputName}
                    value={id}
                    checked={s.input === id}
                    onChange={() => onChange({ input: id })}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-[74px] flex-col justify-center rounded-xl border border-white/[0.10] bg-white/[0.025] px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-white/[0.055] peer-checked:border-primary/45 peer-checked:bg-primary/[0.11] peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,.05)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                      <Icon className={`h-4 w-4 shrink-0 ${s.input === id ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      {title}
                    </span>
                    <span className="mt-1 pl-6 text-[11px] leading-snug text-muted-foreground">{subtitle}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-white/[0.08] pt-4">
        <div className="min-w-[170px]">
          <h4 className="text-sm font-semibold text-foreground/90">Erlaubte Toleranz</h4>
          <p className="mt-1 text-xs text-muted-foreground">Wie nah muss die Schätzung dran sein?</p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="w-[110px]">
            <ValueField
              label="Wert ±"
              value={s.tolerance}
              min={0}
              onChange={tolerance => onChange({ tolerance })}
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-foreground/70">Art</legend>
            <div className="inline-flex h-11 items-center gap-0.5 rounded-xl border border-white/[0.12] bg-white/[0.025] p-1">
              {([
                { id: "percent", title: "Prozentual", label: "%" },
                { id: "absolute", title: "Fester Wert", label: "Wert" },
              ] as const).map(option => (
                <label key={option.id} title={option.title} className="cursor-pointer">
                  <input
                    type="radio"
                    name={toleranceName}
                    checked={s.toleranceType === option.id}
                    onChange={() => onChange({ toleranceType: option.id })}
                    className="peer sr-only"
                    aria-label={option.title}
                  />
                  <span className="inline-flex h-9 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold text-muted-foreground transition-[background-color,color] duration-200 hover:text-foreground peer-checked:bg-primary/25 peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {validTarget && validTolerance && Number.isFinite(lower) && Number.isFinite(upper) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/[0.13] bg-primary/[0.055] px-3.5 py-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/75" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-foreground/75">
            <span className="font-semibold text-foreground/85">Vorschau:</span> Richtig bei {format(lower)} bis {format(upper)}{unit ? ` ${unit}` : ""}.
            <span className="ml-1 text-muted-foreground/75">Im Spiel erscheint nur die Toleranz unter der Frage.</span>
          </p>
        </div>
      )}

      {s.input === "slider" && (
        <div className="border-t border-white/[0.08] pt-2">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={sliderPanelId}
            onClick={() => setExpanded(open => !open)}
            className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-foreground/85">
              <SlidersHorizontal className="h-4 w-4 text-primary/85" aria-hidden="true" />
              Slider-Einstellungen
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {rangeValid ? `${format(s.min)}–${format(s.max)} · Schritte: ${format(s.step)}` : "Bereich festlegen"}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </span>
          </button>
          {expanded && (
            <div id={sliderPanelId} className="space-y-4 px-2 pb-2 pt-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  { key: "min", label: "Minimum" },
                  { key: "max", label: "Maximum" },
                  { key: "step", label: "Schrittweite" },
                ] as const).map(field => (
                  <ValueField
                    key={field.key}
                    label={field.label}
                    value={s[field.key]}
                    onChange={value => onChange({ [field.key]: value })}
                  />
                ))}
              </div>
              {rangeValid && (
                <div className="rounded-xl bg-white/[0.025] px-3.5 py-3">
                  <div className="mb-3 flex justify-between gap-3 text-[11px] text-muted-foreground">
                    <span>Spielbereich</span>
                    <span>{targetOnTrack ? "Zielwert markiert" : "Zielwert außerhalb des Bereichs"}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-white/[0.12]">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/45 to-primary/20" />
                    {targetOnTrack && (
                      <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#1b183f] bg-[#b8a6ff] shadow-[0_0_15px_rgba(164,143,255,.40)]"
                        style={{ left: `${marker}%` }}
                        aria-label="Position der richtigen Zahl im Sliderbereich"
                      />
                    )}
                  </div>
                  <div className="mt-2 flex justify-between gap-2 text-xs tabular-nums text-muted-foreground">
                    <span>{format(s.min)}{unit ? ` ${unit}` : ""}</span>
                    <span>{format(s.max)}{unit ? ` ${unit}` : ""}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
