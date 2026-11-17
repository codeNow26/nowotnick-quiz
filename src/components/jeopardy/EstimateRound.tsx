import { Input } from "@/components/ui/input";
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
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          {(
            [
              ["Dein Tipp", guess],
              ["Richtiger Wert", s.target],
              [
                "Abweichung",
                guess !== undefined && s.target !== undefined
                  ? Math.abs(guess - s.target)
                  : undefined,
              ],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[.04] p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <strong className="break-words text-lg tabular-nums">
                {n === undefined ? "–" : format(n)}
              </strong>
            </div>
          ))}
        </div>
        {guess !== undefined && (
          <p className="font-semibold">
            {estimateHit(s, guess) ? "Innerhalb der Toleranz" : "Außerhalb der Toleranz"} · ±
            {s.toleranceType === "percent" ? s.tolerance + " %" : format(s.tolerance)}
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
