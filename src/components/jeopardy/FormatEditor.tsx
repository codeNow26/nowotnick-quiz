import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import type { Question } from "@/lib/jeopardy-data";
import {
  estimateSettings,
  revealSettings,
  locationSettings,
  formatError,
  type EstimateSettings,
  type RevealSettings,
} from "@/lib/question-formats";
import { LocationImage } from "./LocationImage";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 content-start gap-1.5 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = "any",
}: {
  label: string;
  value?: number;
  onChange: (n?: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Field label={label}>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={editing ?? value ?? ""}
        onBlur={() => setEditing(null)}
        onChange={(e) => {
          setEditing(e.target.value);
          onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : undefined);
        }}
      />
    </Field>
  );
}
function Select<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        className="h-10 rounded-lg border border-white/15 bg-[#171530] px-3 text-sm text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {choices.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function FormatEditor({
  q,
  start,
  update,
}: {
  q: Question;
  start: number;
  update: (fn: (current: Question) => Question) => void;
}) {
  const s = estimateSettings(q),
    r = revealSettings(q, start),
    l = locationSettings(q);
  const error = formatError(q, start);
  function patch(
    key: "estimate" | "location" | "reveal",
    changes: Partial<EstimateSettings> | Partial<RevealSettings> | Partial<typeof l>,
  ) {
    update((current) => ({
      ...current,
      [key]: Object.fromEntries(
        Object.entries({ ...current[key], ...changes }).filter(([, v]) => v !== undefined),
      ),
    }));
  }
  return (
    <fieldset className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[.045] p-4">
      <legend className="px-2 text-sm font-semibold">
        {q.type === "estimate"
          ? "Schätzung"
          : q.type === "location"
            ? "Ziel im Bild"
            : "Enthüllung"}
      </legend>
      {q.type === "estimate" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Richtige Zahl"
              value={s.target}
              onChange={(target) => patch("estimate", { target })}
            />
            <Field label="Einheit (optional)">
              <Input
                value={s.unit}
                placeholder="z. B. km"
                onChange={(e) => patch("estimate", { unit: e.target.value })}
              />
            </Field>
            <Select
              label="Eingabe im Spiel"
              value={s.input}
              choices={[
                ["number", "Freie Zahl"],
                ["slider", "Slider"],
              ]}
              onChange={(input) => patch("estimate", { input })}
            />
            <Select
              label="Toleranzart"
              value={s.toleranceType}
              choices={[
                ["percent", "Prozent"],
                ["absolute", "Absoluter Wert"],
              ]}
              onChange={(toleranceType) => patch("estimate", { toleranceType })}
            />
            <NumberField
              label={`Toleranz ± ${s.toleranceType === "percent" ? "%" : s.unit}`}
              min={0}
              value={s.tolerance}
              onChange={(tolerance) => patch("estimate", { tolerance })}
            />
          </div>
          {s.input === "slider" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ["min", "Minimum"],
                  ["max", "Maximum"],
                  ["step", "Schrittweite"],
                ] as const
              ).map(([key, label]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={s[key]}
                  onChange={(v) => patch("estimate", { [key]: v })}
                />
              ))}
            </div>
          )}
        </>
      )}
      {q.type === "reveal" && (
        <div className="grid grid-cols-2 gap-3">
          {q.imageUrl && q.videoUrl && (
            <Select
              label="Enthülltes Medium"
              value={r.medium}
              choices={[
                ["image", "Bild"],
                ["video", "Video"],
              ]}
              onChange={(medium) => patch("reveal", { medium })}
            />
          )}
          <Select
            label="Methode"
            value={r.method}
            choices={[
              ["tiles", "Kacheln aufdecken"],
              ["mosaic", "Mosaik"],
              ["blur", "Unschärfe reduzieren"],
            ]}
            onChange={(method) => patch("reveal", { method })}
          />
          <Select
            label="Fortschritt"
            value={r.advance}
            choices={[
              ["manual", "Per Klick"],
              ["auto", "Automatisch"],
            ]}
            onChange={(advance) => patch("reveal", { advance })}
          />
          {r.advance === "auto" && (
            <NumberField
              label="Sekunden pro Stufe"
              min={1}
              max={300}
              value={r.seconds}
              onChange={(seconds) => patch("reveal", { seconds })}
            />
          )}
          <NumberField
            label="Punktabzug je Stufe"
            min={1}
            step={1}
            value={r.deduction}
            onChange={(deduction) => patch("reveal", { deduction })}
          />
          <NumberField
            label="Mindestpunkte"
            min={0}
            max={start}
            step={1}
            value={r.floor}
            onChange={(floor) => patch("reveal", { floor })}
          />
        </div>
      )}
      {q.type === "location" && (
        <>
          <NumberField
            label="Trefferradius (% der kürzeren Bildseite)"
            min={0.1}
            max={100}
            value={l.radius}
            onChange={(radius) => patch("location", { radius })}
          />
          {q.imageUrl && (
            <LocationImage
              key={q.imageUrl}
              src={q.imageUrl}
              target={l.target}
              radius={Math.max(0, l.radius)}
              label="Ziel markieren"
              onPick={(target, aspect) => patch("location", { target, aspect })}
            />
          )}
        </>
      )}
      {error && (
        <p className="text-sm text-amber-200" role="status">
          {error}
        </p>
      )}
    </fieldset>
  );
}
