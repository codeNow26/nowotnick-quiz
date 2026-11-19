import { useState } from "react";
import { ChevronDown, Gift, Minus, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  bonusMilestone, bonusQuestionError, newBonusQuestion,
  type BonusQuestion, type BonusSettings,
} from "@/lib/bonus-rounds";

function Numeric({
  label, value, onChange, min, max,
}: {
  label: string; value?: number; onChange: (number: number | undefined) => void;
  min?: number; max?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input type="number" inputMode="decimal" min={min} max={max}
        className="quiz-number-input h-10 rounded-xl border-white/15 bg-white/[.045]"
        value={draft ?? value ?? ""}
        onChange={e => {
          setDraft(e.target.value);
          onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : undefined);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

export function BonusEditor({
  settings: s, onChange, totalQuestions,
}: {
  settings: BonusSettings;
  onChange: (settings: BonusSettings) => void;
  totalQuestions: number;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const patch = (changes: Partial<BonusSettings>) => onChange({ ...s, ...changes });
  const edit = (index: number, change: Partial<BonusQuestion>) => {
    patch({ rounds: s.rounds.map((r, i) => i === index ? { ...r, ...change } : r) });
  };
  const count = s.rounds.length;
  return (
    <section className="mb-4 rounded-2xl border border-white/[.09] bg-white/[.015]">
      <button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/[.025] focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground/80">
          <Gift className="h-4 w-4 text-primary/75" aria-hidden="true" />
          Spiel-Extras
          {s.enabled && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">{count} Schätzrunden</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-5 border-t border-white/[.08] px-4 pb-5 pt-4">
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Gemeinsame Schätzrunden</span>
              <span className="mt-1 block text-xs text-muted-foreground">Geheime Tipps über ein herumgereichtes Handy</span>
            </span>
            <input type="checkbox" checked={s.enabled}
              onChange={e => patch({ enabled: e.target.checked, rounds: s.rounds.length ? s.rounds : [newBonusQuestion(0)] })}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
            />
          </label>
          {s.enabled && <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="text-sm font-medium">Anzahl der Schätzrunden</span>
              <div className="flex items-center gap-3">
                <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-xl" disabled={count <= 1}
                  aria-label="Eine Schätzrunde weniger"
                  onClick={() => { patch({ rounds: s.rounds.slice(0, -1) }); setSelected(Math.min(selected, count-2)); }}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center font-display text-xl tabular-nums">{count}</span>
                <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-xl" disabled={count >= 10}
                  aria-label="Eine Schätzrunde mehr"
                  onClick={() => { patch({ rounds: [...s.rounds, newBonusQuestion(count)] }); setSelected(count); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div>
                <h4 className="text-sm font-medium">Wann kommen die Runden?</h4>
                <p className="mt-1 text-xs text-muted-foreground">Gleichmäßig zwischen zwei Fortschrittspunkten verteilt, unabhängig von Kategorien.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="flex justify-between text-xs text-muted-foreground">Erste Runde ab <strong className="text-foreground">{s.startPercent}%</strong></span>
                  <input type="range" min="5" max="70" step="5" value={s.startPercent}
                    onChange={e => patch({ startPercent: Math.min(Number(e.target.value), s.endPercent - 5) })}
                    className="w-full accent-primary" />
                </label>
                <label className="grid gap-2">
                  <span className="flex justify-between text-xs text-muted-foreground">Letzte Runde bis <strong className="text-foreground">{s.endPercent}%</strong></span>
                  <input type="range" min="30" max="95" step="5" value={s.endPercent}
                    onChange={e => patch({ endPercent: Math.max(Number(e.target.value), s.startPercent + 5) })}
                    className="w-full accent-primary" />
                </label>
              </div>
              <p className="text-xs text-primary/85">
                <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Nach {s.rounds.map((_, i) => bonusMilestone(i, totalQuestions, s)).join(", ")} beantworteten Fragen.
              </p>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-4">
              <h4 className="text-sm font-medium">Schätzfragen vorbereiten</h4>
              <div className="flex flex-wrap gap-2">
                {s.rounds.map((round, i) => (
                  <button key={round.id} type="button" onClick={() => setSelected(i)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${selected === i ? "border-primary/55 bg-primary/15 text-foreground" : "border-white/10 bg-white/[.025] text-muted-foreground hover:bg-white/[.07]"}`}>
                    {bonusQuestionError(round) ? "○" : "✓"} Runde {i + 1}
                  </button>
                ))}
              </div>
              {s.rounds[selected] && (
                <div className="space-y-3 rounded-2xl border border-white/[.09] bg-white/[.025] p-3 sm:p-4">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Frage</span>
                    <Textarea value={s.rounds[selected].question}
                      onChange={e => edit(selected, { question: e.target.value })}
                      placeholder="Was sollen alle schätzen?"
                      rows={2} maxLength={500} className="rounded-xl border-white/15 bg-white/[.035]" />
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Numeric label="Richtige Zahl" value={s.rounds[selected].target} onChange={target => edit(selected, { target })} />
                    <label className="grid min-w-0 gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Einheit</span>
                      <Input className="h-10 rounded-xl border-white/15 bg-white/[.045]" placeholder="z. B. m" maxLength={32}
                        value={s.rounds[selected].unit} onChange={e => edit(selected, { unit: e.target.value })} />
                    </label>
                    <Numeric label="Minimum" value={s.rounds[selected].min} onChange={min => edit(selected, { min: min ?? 0 })} />
                    <Numeric label="Maximum" value={s.rounds[selected].max} onChange={max => edit(selected, { max: max ?? 0 })} />
                    <Numeric label="Schrittweite" value={s.rounds[selected].step} onChange={step => edit(selected, { step: step ?? 0 })} min={0.000001} />
                    <Numeric label="Gewinnpunkte" value={s.rounds[selected].points} onChange={points => edit(selected, { points: points ?? 0 })} min={1} />
                  </div>
                  {bonusQuestionError(s.rounds[selected]) && <p role="status" className="text-xs text-amber-200">{bonusQuestionError(s.rounds[selected])}</p>}
                </div>
              )}
            </div>
          </>}
        </div>
      )}
    </section>
  );
}
