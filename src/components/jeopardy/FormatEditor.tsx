import { useId, useState, type ReactNode } from "react";
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
import { EstimateEditor } from "./EstimateEditor";

const control =
  "h-9 w-full min-w-0 rounded-lg border border-white/[.14] bg-white/[.035] px-2.5 py-1 text-sm font-normal text-foreground shadow-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";
const row = "flex flex-wrap items-end gap-x-5 gap-y-2.5";
const caption = "text-[13px] font-medium leading-4 text-foreground/75";

function Field({
  label,
  hideLabel,
  children,
}: {
  label: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className={hideLabel ? "sr-only" : caption}>{label}</span>
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
  describedBy,
}: {
  label: string;
  value?: number;
  onChange: (n?: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  describedBy?: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Field label={label}>
      <Input
        className={control + " quiz-number-input"}
        aria-describedby={describedBy}
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
type ChoiceProps<T extends string> = {
  label: string;
  value: T;
  choices: [T, string][];
  onChange: (value: T) => void;
};
function Select<T extends string>({
  label,
  value,
  choices,
  onChange,
  hideLabel,
}: ChoiceProps<T> & { hideLabel?: boolean }) {
  return (
    <Field label={label} hideLabel={hideLabel}>
      <select
        className={control}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {choices.map(([key, text]) => (
          <option key={key} value={key} className="bg-[#171530]">
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Segments<T extends string>({ label, value, choices, onChange }: ChoiceProps<T>) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className={caption + " mb-1"}>{label}</legend>
      <div className="inline-flex h-9 max-w-full items-stretch rounded-lg bg-white/[.06] p-0.5">
        {choices.map(([key, text]) => (
          <label key={key} className="relative inline-flex min-w-0 cursor-pointer">
            <input
              type="radio"
              className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
            />
            <span className="inline-flex items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-foreground/65 peer-hover:text-foreground peer-checked:bg-[#484070] peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-primary">
              {text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
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
  const radiusHint = useId();
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
    <fieldset className="min-w-0 space-y-2.5 border-0 border-t border-solid border-white/10 pt-3">
      <legend className="sr-only">
        {q.type === "estimate"
          ? "Schätzung"
          : q.type === "location"
            ? "Ziel im Bild"
            : "Enthüllung"}
      </legend>
      {q.type === "estimate" && (
        <EstimateEditor
          settings={s}
          onChange={changes => patch("estimate", changes)}
        />
      )}
      {q.type === "reveal" && (
        <>
          <div className={row}>
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
            <Segments
              label="Aufdecken"
              value={r.advance}
              choices={[
                ["manual", "Per Klick"],
                ["auto", "Automatisch"],
              ]}
              onChange={(advance) => patch("reveal", { advance })}
            />
            {r.advance === "auto" && (
              <div className="w-32 max-w-full">
                <NumberField
                  label="Sekunden pro Stufe"
                  min={1}
                  max={300}
                  value={r.seconds}
                  onChange={(seconds) => patch("reveal", { seconds })}
                />
              </div>
            )}
          </div>
          <div className="grid w-64 max-w-full grid-cols-[1.25fr_1fr] items-end gap-2">
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
        </>
      )}
      {q.type === "location" && (
        <>
          <div className="flex items-end gap-2">
            <div className="w-[6.25rem] shrink-0">
              <NumberField
                label="Trefferradius"
                min={0.1}
                max={100}
                value={l.radius}
                onChange={(radius) => patch("location", { radius })}
                describedBy={radiusHint}
              />
            </div>
            <span
              id={radiusHint}
              className="flex min-h-9 items-center text-xs text-muted-foreground"
            >
              % der kürzeren Bildseite
            </span>
          </div>
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
