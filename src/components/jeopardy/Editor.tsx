import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { Category } from "@/lib/jeopardy-data";
import { POINT_VALUES } from "@/lib/jeopardy-data";

interface EditorProps {
  initial: Category[];
  initialMeta: { title: string; subtitle: string };
  onSave: (categories: Category[]) => void;
  onSaveMeta: (meta: { title: string; subtitle: string }) => void;
  onReset: () => void;
  onBack: () => void;
}

export function Editor({
  initial,
  initialMeta,
  onSave,
  onSaveMeta,
  onReset,
  onBack,
}: EditorProps) {
  const [draft, setDraft] = useState<Category[]>(() =>
    initial.map((c) => ({ name: c.name, questions: c.questions.map((q) => ({ ...q })) }))
  );
  const [titleDraft, setTitleDraft] = useState(initialMeta.title);
  const [subtitleDraft, setSubtitleDraft] = useState(initialMeta.subtitle);
  const [activeCat, setActiveCat] = useState(0);

  const updateCatName = (name: string) => {
    setDraft((prev) => prev.map((c, i) => (i === activeCat ? { ...c, name } : c)));
  };

  const updateQ = (qIdx: number, field: "question" | "answer", value: string) => {
    setDraft((prev) =>
      prev.map((c, i) =>
        i === activeCat
          ? {
              ...c,
              questions: c.questions.map((q, j) =>
                j === qIdx ? { ...q, [field]: value } : q
              ),
            }
          : c
      )
    );
  };

  const updateQValue = (qIdx: number, value: number | undefined) => {
  setDraft((prev) =>
    prev.map((c, i) =>
      i === activeCat
        ? {
            ...c,
            questions: c.questions.map((q, j) =>
              j === qIdx ? { ...q, value } : q
            ),
          }
        : c
    )
  );
};

  const handleSave = () => {
    onSave(draft);
    onSaveMeta({
      title: titleDraft.trim() || initialMeta.title,
      subtitle: subtitleDraft.trim(),
    });
    onBack();
  };

  const handleReset = () => {
    if (confirm("Alle Kategorien, Titel und Fragen auf Standard zurücksetzen?")) {
      onReset();
      onBack();
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-2 mb-6">
        <Button
          onClick={onBack}
          className="glass text-foreground hover:bg-white/15 border-white/15 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <h1
          className="font-display text-xl md:text-3xl text-foreground tracking-tight uppercase"
          style={{ textShadow: "0 0 30px oklch(0.55 0.24 278 / 0.6)" }}
        >
          Bearbeiten
        </h1>
        <Button
          onClick={handleReset}
          className="glass text-destructive hover:bg-destructive/20 border-destructive/30 rounded-xl"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
        {draft.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCat(i)}
            className={`px-2 py-3 rounded-xl font-display text-xs md:text-sm uppercase tracking-wider transition-all truncate border ${
              activeCat === i
                ? "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_24px_-6px_var(--indigo-glow)]"
                : "glass text-foreground/80 hover:text-foreground hover:bg-white/10"
            }`}
            title={c.name}
          >
            {c.name || `Kat. ${i + 1}`}
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-3xl p-4 md:p-6 space-y-4 glow-primary mb-4">
        <div className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
          Spiel-Kopfzeile
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block">
            Titel
          </Label>
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl"
            maxLength={40}
            placeholder="Familienquiz"
          />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block">
            Untertitel
          </Label>
          <Input
            value={subtitleDraft}
            onChange={(e) => setSubtitleDraft(e.target.value)}
            className="glass border-white/10 text-foreground h-11 rounded-xl"
            maxLength={120}
            placeholder="Das klassische Quizspiel – ganz nach euch."
          />
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-4 md:p-6 space-y-6 glow-primary">
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-2 block">
            Kategoriename
          </Label>
          <Input
            value={draft[activeCat].name}
            onChange={(e) => updateCatName(e.target.value)}
            className="glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl"
            maxLength={40}
          />
        </div>

        <div className="space-y-5">
          {draft[activeCat].questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="glass rounded-2xl p-4 space-y-3"
            >
             <div className="flex items-center gap-3">
  <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
    Punkte
  </Label>

  <Input
    type="number"
    min={0}
    value={q.value ?? POINT_VALUES[qIdx]}
    onChange={(e) =>
      updateQValue(
        qIdx,
        e.target.value === "" ? undefined : Number(e.target.value)
      )
    }
    className="glass border-white/10 text-foreground font-display text-lg h-11 rounded-xl w-28"
  />
</div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Frage</Label>
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQ(qIdx, "question", e.target.value)}
                  rows={2}
                  className="glass border-white/10 text-foreground rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Antwort</Label>
                <Input
                  value={q.answer}
                  onChange={(e) => updateQ(qIdx, "answer", e.target.value)}
                  className="glass border-white/10 text-foreground rounded-xl mt-1 h-11"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          size="lg"
          className="w-full font-display text-lg md:text-xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
        >
          Änderungen speichern
        </Button>
      </div>
    </div>
  );
}
