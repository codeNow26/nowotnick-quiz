import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { estimateHit, type EstimateSettings } from "@/lib/question-formats";

export function EstimateRound({
  settings: s,
  raw,
  guess,
  revealed,
  onInput,
}: {
  settings: EstimateSettings;
  raw: string;
  guess?: number;
  revealed: boolean;
  onInput: (text: string) => void;
}) {
  const format = (n: number) =>
    [n.toLocaleString("de-DE", { maximumSignificantDigits: 15 }), s.unit].filter(Boolean).join(" ");
  if (revealed)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-1">
        <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-7">
          <div className="min-w-0 text-center">
            <p className="mb-1 text-xs text-muted-foreground">Dein Tipp</p>
            <strong className="block break-words font-display text-xl tabular-nums text-foreground sm:text-2xl">
              {guess === undefined ? "–" : format(guess)}
            </strong>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary/65" aria-hidden="true" />
          <div className="min-w-0 text-center">
            <p className="mb-1 text-xs text-muted-foreground">Richtig</p>
            <strong className="block break-words font-display text-xl tabular-nums text-foreground sm:text-2xl">
              {s.target === undefined ? "–" : format(s.target)}
            </strong>
          </div>
        </div>
        {guess !== undefined && (
          <p className={`flex items-center justify-center gap-2 text-base font-semibold ${estimateHit(s, guess) ? "text-emerald-300" : "text-rose-300"}`}>
            {estimateHit(s, guess)
              ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              : <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />}
            {estimateHit(s, guess) ? "Richtig geschätzt!" : "Leider daneben"}
          </p>
        )}
      </div>
    );
  return (
    <label className="mx-auto grid max-w-md gap-2 text-left text-sm">
      <span>Deine Schätzung{s.unit && " (" + s.unit + ")"}</span>
      {s.input === "slider" ? (
        <>
          <output className="text-center font-display text-2xl">
            {guess !== undefined && format(guess)}
          </output>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={guess ?? s.min}
            onChange={(e) => onInput(e.target.value)}
            className="w-full accent-primary"
          />
          <span className="flex justify-between text-xs text-muted-foreground">
            <span>{format(s.min)}</span>
            <span>{format(s.max)}</span>
          </span>
        </>
      ) : (
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={(e) => onInput(e.target.value)}
          placeholder="Zahl eingeben"
          aria-invalid={!!raw && guess === undefined}
        />
      )}
    </label>
  );
}
