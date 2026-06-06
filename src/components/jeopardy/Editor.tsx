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
  onSave: (categories: Category[]) => void;
  onReset: () => void;
  onBack: () => void;
}

export function Editor({ initial, onSave, onReset, onBack }: EditorProps) {
  const [draft, setDraft] = useState<Category[]>(() =>
    initial.map((c) => ({ name: c.name, questions: c.questions.map((q) => ({ ...q })) }))
  );
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

  const handleSave = () => {
    onSave(draft);
    onBack();
  };

  const handleReset = () => {
    if (confirm("Reset all categories and questions to defaults?")) {
      onReset();
      onBack();
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-2 mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="font-display text-2xl md:text-4xl text-primary text-shadow-gold tracking-wider">
          EDIT GAME
        </h1>
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {draft.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCat(i)}
            className={`px-2 py-3 rounded-md font-display text-xs md:text-sm uppercase tracking-wide transition-all truncate ${
              activeCat === i
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-jeopardy-blue-dark text-primary hover:bg-jeopardy-blue"
            }`}
            title={c.name}
          >
            {c.name || `Cat ${i + 1}`}
          </button>
        ))}
      </div>

      <div className="bg-card/80 backdrop-blur rounded-2xl p-4 md:p-6 border-2 border-primary/40 shadow-2xl space-y-6">
        <div>
          <Label className="text-muted-foreground text-sm mb-2 block">Category name</Label>
          <Input
            value={draft[activeCat].name}
            onChange={(e) => updateCatName(e.target.value)}
            className="bg-input border-border text-foreground font-display text-lg"
            maxLength={40}
          />
        </div>

        <div className="space-y-5">
          {draft[activeCat].questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="border-l-4 border-primary pl-4 py-1 space-y-2"
            >
              <div className="font-display text-primary text-shadow-gold text-xl">
                ${POINT_VALUES[qIdx]}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Question</Label>
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQ(qIdx, "question", e.target.value)}
                  rows={2}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Answer</Label>
                <Input
                  value={q.answer}
                  onChange={(e) => updateQ(qIdx, "answer", e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          size="lg"
          className="w-full font-display text-xl py-6 bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider"
        >
          SAVE CHANGES
        </Button>
      </div>
    </div>
  );
}
