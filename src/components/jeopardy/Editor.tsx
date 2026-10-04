import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, RotateCcw } from "lucide-react";
import type { Category, Question } from "@/lib/jeopardy-data";
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
    initial.map((c) => ({
      ...c,
      questions: c.questions.map((q) => ({
        ...q,
        ...(q.orderItems ? { orderItems: [...q.orderItems] } : {}),
      })),
    }))
  );
  const [titleDraft, setTitleDraft] = useState(initialMeta.title);
  const [subtitleDraft, setSubtitleDraft] = useState(initialMeta.subtitle);
  const [activeCat, setActiveCat] = useState(0);
  const [validationError, setValidationError] = useState("");

  const updateCatName = (name: string) => {
    setDraft((prev) => prev.map((c, i) => (i === activeCat ? { ...c, name } : c)));
  };

  const patchQuestion = (qIdx: number, update: (question: Question) => Question) => {
    setValidationError("");
    setDraft((prev) => prev.map((c, i) => i === activeCat
      ? { ...c, questions: c.questions.map((q, j) => j === qIdx ? update(q) : q) }
      : c
    ));
  };

  const updateQ = (qIdx: number, field: "question" | "answer", value: string) => {
    patchQuestion(qIdx, (q) => ({ ...q, [field]: value }));
  };

  const updateQValue = (qIdx: number, value: number | undefined) => {
    patchQuestion(qIdx, (q) => ({ ...q, value }));
  };

  const updateQuestionType = (qIdx: number, type: "normal" | "order") => {
    patchQuestion(qIdx, (q) => ({
      ...q,
      type,
      ...(type === "order" && !q.orderItems?.length ? { orderItems: ["", ""] } : {}),
    }));
  };

  const updateOrderItem = (qIdx: number, itemIndex: number, text: string) => {
    patchQuestion(qIdx, (q) => ({
      ...q,
      orderItems: (q.orderItems ?? []).map((item, i) => i === itemIndex ? text : item),
    }));
  };

  const moveOrderItem = (qIdx: number, itemIndex: number, direction: -1 | 1) => {
    patchQuestion(qIdx, (q) => {
      const items = [...(q.orderItems ?? [])];
      const target = itemIndex + direction;
      if (target < 0 || target >= items.length) return q;
      [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
      return { ...q, orderItems: items };
    });
  };

  const handleSave = () => {
    for (let cIdx = 0; cIdx < draft.length; cIdx++) {
      for (let qIdx = 0; qIdx < draft[cIdx].questions.length; qIdx++) {
        const q = draft[cIdx].questions[qIdx];
        if (q.type !== "order") continue;
        const items = (q.orderItems ?? []).map((item) => item.trim());
        const location = `${draft[cIdx].name || `Kategorie ${cIdx + 1}`}, Frage ${qIdx + 1}`;
        let error = "";
        if (items.length < 2 || items.some((item) => !item)) {
          error = `${location}: Bitte mindestens zwei Begriffe eintragen und leere Felder ausfüllen oder entfernen.`;
        } else if (new Set(items.map((item) => item.toLocaleLowerCase("de"))).size !== items.length) {
          error = `${location}: Bitte unterschiedliche Begriffe verwenden, damit die Reihenfolge eindeutig ist.`;
        }
        if (error) {
          setActiveCat(cIdx);
          setValidationError(error);
          return;
        }
      }
    }
    const categories = draft.map((c) => ({
      ...c,
      questions: c.questions.map((q) => {
        if (q.type !== "order") return { ...q };
        const orderItems = (q.orderItems ?? []).map((item) => item.trim());
        return {
          ...q,
          orderItems,
          // Antwort bleibt auch für vorhandene Export- und Anzeigewege verfügbar.
          answer: orderItems.map((item, index) => `${index + 1}. ${item}`).join("\n"),
        };
      }),
    }));
    onSave(categories);
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
        <Button onClick={onBack} className="glass text-foreground hover:bg-white/15 border-white/15 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <h1
          className="font-display text-xl md:text-3xl text-foreground tracking-tight uppercase"
          style={{ textShadow: "0 0 30px oklch(0.55 0.24 278 / 0.6)" }}
        >
          Bearbeiten
        </h1>
        <Button onClick={handleReset} className="glass text-destructive hover:bg-destructive/20 border-destructive/30 rounded-xl">
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
        <div className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Spiel-Kopfzeile</div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block">Titel</Label>
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl"
            maxLength={40}
            placeholder="Familienquiz"
          />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block">Untertitel</Label>
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
        {draft[activeCat] && (
          <>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-2 block">Kategoriename</Label>
              <Input
                value={draft[activeCat].name}
                onChange={(e) => updateCatName(e.target.value)}
                className="glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl"
                maxLength={40}
              />
            </div>

            <div className="space-y-5">
              {draft[activeCat].questions.map((q, qIdx) => (
                <div key={`${activeCat}-${qIdx}`} className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Punkte</Label>
                    <Input
                      type="number"
                      min={0}
                      value={q.value ?? POINT_VALUES[qIdx]}
                      onChange={(e) => updateQValue(qIdx, e.target.value === "" ? undefined : Number(e.target.value))}
                      className="glass border-white/10 text-foreground font-display text-lg h-11 rounded-xl w-28"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Fragetyp für Frage ${qIdx + 1}`}>
                    <span className="text-xs text-muted-foreground uppercase tracking-[0.18em] mr-1">Fragetyp</span>
                    {(["normal", "order"] as const).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        onClick={() => updateQuestionType(qIdx, type)}
                        aria-pressed={(q.type ?? "normal") === type}
                        className={`rounded-xl border ${(q.type ?? "normal") === type
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : "glass text-foreground border-white/10 hover:bg-white/10"}`}
                      >
                        {type === "normal" ? "Normal" : "Reihenfolge"}
                      </Button>
                    ))}
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
                  {q.type === "order" ? (
                    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Richtige Reihenfolge</p>
                      <p className="text-sm text-muted-foreground">
                        Oben steht der erste Begriff, unten der letzte. Im Spiel werden die Begriffe gemischt.
                        Gib in der Frage die Richtung an, zum Beispiel „vom ältesten zum neuesten“.
                      </p>
                      {(q.orderItems ?? []).map((item, itemIndex) => (
                        <div key={itemIndex} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="w-6 shrink-0 text-primary font-bold">{itemIndex + 1}.</span>
                          <Input
                            value={item}
                            onChange={(e) => updateOrderItem(qIdx, itemIndex, e.target.value)}
                            aria-label={`Begriff ${itemIndex + 1} für Frage ${qIdx + 1}`}
                            placeholder={`Begriff ${itemIndex + 1}`}
                            className="glass border-white/10 text-foreground rounded-xl h-11 min-w-0 flex-1"
                          />
                          <div className="flex gap-1 ml-auto">
                            <Button type="button" variant="ghost" size="icon" disabled={itemIndex === 0}
                              aria-label={`Begriff ${itemIndex + 1} nach oben`} onClick={() => moveOrderItem(qIdx, itemIndex, -1)}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" disabled={itemIndex === (q.orderItems?.length ?? 0) - 1}
                              aria-label={`Begriff ${itemIndex + 1} nach unten`} onClick={() => moveOrderItem(qIdx, itemIndex, 1)}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" aria-label={`Begriff ${itemIndex + 1} entfernen`}
                              className="text-destructive hover:bg-destructive/15"
                              onClick={() => patchQuestion(qIdx, (current) => ({
                                ...current, orderItems: (current.orderItems ?? []).filter((_, i) => i !== itemIndex),
                              }))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="glass border-white/10 rounded-xl"
                        onClick={() => patchQuestion(qIdx, (current) => ({
                          ...current, orderItems: [...(current.orderItems ?? []), ""],
                        }))}>
                        <Plus className="mr-2 h-4 w-4" /> Begriff hinzufügen
                      </Button>
                      <p className="text-xs text-muted-foreground">Die Antwort wird beim Speichern aus dieser Reihenfolge erstellt.</p>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Antwort</Label>
                      <Input
                        value={q.answer}
                        onChange={(e) => updateQ(qIdx, "answer", e.target.value)}
                        className="glass border-white/10 text-foreground rounded-xl mt-1 h-11"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {validationError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive">{validationError}</p>}
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
