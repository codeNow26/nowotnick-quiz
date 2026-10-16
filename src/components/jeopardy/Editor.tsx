import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, GripVertical, ImagePlus, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
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
      name: c.name,
      questions: c.questions.map((q) => ({
        ...q,
        orderItems: q.orderItems ? [...q.orderItems] : undefined,
      })),
    }))
  );
  const [titleDraft, setTitleDraft] = useState(initialMeta.title);
  const [subtitleDraft, setSubtitleDraft] = useState(initialMeta.subtitle);
  const [activeCat, setActiveCat] = useState(0);
  const [openImageEditors, setOpenImageEditors] = useState<Record<string, boolean>>({});
  const [processingImages, setProcessingImages] = useState<Record<string, boolean>>({});

  const toggleImageEditor = (qIdx: number) => {
    const key = `${activeCat}-${qIdx}`;
    setOpenImageEditors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeImageEditor = (qIdx: number) => {
    const key = `${activeCat}-${qIdx}`;
    setOpenImageEditors((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const fileToOptimizedDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        reject(new Error("Bitte JPG, PNG oder WEBP verwenden."));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        reject(new Error("Das Bild darf maximal 10 MB groß sein."));
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));

        image.onload = () => {
          const maxDimension = 1600;
          const scale = Math.min(
            1,
            maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
          );

          const width = Math.max(1, Math.round(image.naturalWidth * scale));
          const height = Math.max(1, Math.round(image.naturalHeight * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Bild konnte nicht verarbeitet werden."));
            return;
          }

          context.drawImage(image, 0, 0, width, height);

          const optimized = canvas.toDataURL("image/webp", 0.82);
          resolve(optimized);
        };

        image.src = String(reader.result);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (qIdx: number, file: File | undefined) => {
    if (!file) return;

    const key = `${activeCat}-${qIdx}`;

    setProcessingImages((prev) => ({
      ...prev,
      [key]: true,
    }));

    try {
      const imageDataUrl = await fileToOptimizedDataUrl(file);
      updateQ(qIdx, "imageUrl", imageDataUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      setProcessingImages((prev) => ({
        ...prev,
        [key]: false,
      }));
    }
  };

  const updateCatName = (name: string) => {
    setDraft((prev) => prev.map((c, i) => (i === activeCat ? { ...c, name } : c)));
  };

  const updateQuestion = (qIdx: number, updater: (q: Question) => Question) => {
    setDraft((prev) =>
      prev.map((c, i) =>
        i === activeCat
          ? {
              ...c,
              questions: c.questions.map((q, j) => (j === qIdx ? updater(q) : q)),
            }
          : c
      )
    );
  };

  const updateQ = (qIdx: number, field: "question" | "answer" | "imageUrl", value: string) => {
    updateQuestion(qIdx, (q) => ({ ...q, [field]: value }));
  };

  const updateQValue = (qIdx: number, value: number | undefined) => {
    updateQuestion(qIdx, (q) => ({ ...q, value }));
  };

  const setQuestionType = (qIdx: number, type: "normal" | "order") => {
    updateQuestion(qIdx, (q) => {
      if (type === "order") {
        const existing = q.orderItems?.length ? q.orderItems : ["", "", "", ""];
        return {
          ...q,
          type: "order",
          orderItems: existing,
          answer: existing.filter(Boolean).join(" → "),
        };
      }

      return {
        ...q,
        type: "normal",
        orderItems: undefined,
      };
    });
  };

  const updateOrderItem = (qIdx: number, itemIdx: number, value: string) => {
    updateQuestion(qIdx, (q) => {
      const items = [...(q.orderItems ?? [])];
      items[itemIdx] = value;
      return {
        ...q,
        type: "order",
        orderItems: items,
        answer: items.filter((item) => item.trim()).join(" → "),
      };
    });
  };

  const addOrderItem = (qIdx: number) => {
    updateQuestion(qIdx, (q) => {
      const items = [...(q.orderItems ?? []), ""];
      return {
        ...q,
        type: "order",
        orderItems: items,
        answer: items.filter((item) => item.trim()).join(" → "),
      };
    });
  };

  const removeOrderItem = (qIdx: number, itemIdx: number) => {
    updateQuestion(qIdx, (q) => {
      const items = (q.orderItems ?? []).filter((_, index) => index !== itemIdx);
      return {
        ...q,
        type: "order",
        orderItems: items,
        answer: items.filter((item) => item.trim()).join(" → "),
      };
    });
  };

  const moveOrderItem = (qIdx: number, itemIdx: number, direction: -1 | 1) => {
    updateQuestion(qIdx, (q) => {
      const items = [...(q.orderItems ?? [])];
      const target = itemIdx + direction;
      if (target < 0 || target >= items.length) return q;

      [items[itemIdx], items[target]] = [items[target], items[itemIdx]];

      return {
        ...q,
        type: "order",
        orderItems: items,
        answer: items.filter((item) => item.trim()).join(" → "),
      };
    });
  };

  const handleSave = () => {
    const cleaned = draft.map((category) => ({
      ...category,
      questions: category.questions.map((q) => {
        if (q.type !== "order") {
          return {
            ...q,
            type: "normal" as const,
            orderItems: undefined,
            imageUrl: q.imageUrl?.trim() || undefined,
          };
        }

        const orderItems = (q.orderItems ?? []).map((item) => item.trim()).filter(Boolean);
        return {
          ...q,
          type: "order" as const,
          orderItems,
          answer: orderItems.join(" → "),
          imageUrl: q.imageUrl?.trim() || undefined,
        };
      }),
    }));

    onSave(cleaned);
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
          {draft[activeCat].questions.map((q, qIdx) => {
            const isOrder = q.type === "order";
            const imageEditorKey = `${activeCat}-${qIdx}`;
            const imageEditorOpen = Boolean(openImageEditors[imageEditorKey]);
            const hasImage = Boolean(q.imageUrl?.trim());
            const isUploadedImage = q.imageUrl?.startsWith("data:image/") ?? false;
            const imageProcessing = Boolean(processingImages[imageEditorKey]);

            return (
              <div key={qIdx} className="glass rounded-2xl p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
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

                  <div className="ml-auto flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => setQuestionType(qIdx, "normal")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        !isOrder
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionType(qIdx, "order")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        isOrder
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Reihenfolge
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                    Frage
                  </Label>
                  <Textarea
                    value={q.question}
                    onChange={(e) => updateQ(qIdx, "question", e.target.value)}
                    rows={2}
                    className="glass border-white/10 text-foreground rounded-xl mt-1"
                    placeholder={
                      isOrder
                        ? "z. B. Ordne diese Songs nach Erscheinungsjahr – ältester zuerst."
                        : undefined
                    }
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleImageEditor(qIdx)}
                    className={`
                      w-full
                      flex items-center justify-between gap-3
                      rounded-xl
                      border
                      px-3 py-2.5
                      text-sm
                      transition-all
                      ${
                        hasImage
                          ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/[0.10]"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" />
                      {hasImage ? "Bild vorhanden ✓" : "Bild hinzufügen"}
                    </span>

                    {imageEditorOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {imageEditorOpen && (
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-3 space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                            Bild-URL
                          </Label>
                          <Input
                            type="url"
                            value={isUploadedImage ? "" : q.imageUrl ?? ""}
                            onChange={(e) => updateQ(qIdx, "imageUrl", e.target.value)}
                            className="glass border-white/10 text-foreground rounded-xl mt-1 h-11"
                            placeholder={
                              isUploadedImage
                                ? "Eigenes Bild ist gespeichert – URL ersetzt es"
                                : "https://.../bild.jpg"
                            }
                          />
                        </div>

                        <label
                          className={`
                            h-11
                            inline-flex items-center justify-center gap-2
                            rounded-xl
                            border border-primary/25
                            bg-primary/[0.08]
                            px-4
                            text-sm font-semibold
                            text-primary
                            transition-all
                            hover:bg-primary/[0.14]
                            cursor-pointer
                            ${imageProcessing ? "opacity-60 pointer-events-none" : ""}
                          `}
                        >
                          <Upload className="h-4 w-4" />
                          {imageProcessing ? "Wird verarbeitet…" : "Eigenes Bild hochladen"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={imageProcessing}
                            onChange={(event) => {
                              void handleImageUpload(qIdx, event.target.files?.[0]);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>

                      <p className="text-[11px] text-muted-foreground/70">
                        JPG, PNG oder WEBP · max. 10 MB. Eigene Bilder werden automatisch verkleinert und im Quiz gespeichert.
                      </p>

                      {hasImage && (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                          <img
                            key={q.imageUrl}
                            src={q.imageUrl}
                            alt="Vorschau"
                            referrerPolicy="no-referrer"
                            className="mx-auto max-h-32 max-w-full rounded-lg object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />

                          {isUploadedImage && (
                            <div className="mt-2 text-center text-[11px] text-emerald-300/80">
                              Eigenes Bild gespeichert ✓
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {hasImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              updateQ(qIdx, "imageUrl", "");
                              closeImageEditor(qIdx);
                            }}
                            className="glass border-destructive/20 text-destructive hover:bg-destructive/15 rounded-xl"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Bild entfernen
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => closeImageEditor(qIdx)}
                          className="ml-auto glass border-white/10 rounded-xl"
                        >
                          Fertig
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {!isOrder ? (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                      Antwort
                    </Label>
                    <Input
                      value={q.answer}
                      onChange={(e) => updateQ(qIdx, "answer", e.target.value)}
                      className="glass border-white/10 text-foreground rounded-xl mt-1 h-11"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                        Richtige Reihenfolge
                      </Label>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Von oben nach unten = richtige Reihenfolge. Mit den Pfeilen kannst du sie ändern.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {(q.orderItems ?? []).map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <div className="h-11 w-9 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <div className="h-11 w-8 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display text-primary">
                            {itemIdx + 1}
                          </div>

                          <Input
                            value={item}
                            onChange={(e) => updateOrderItem(qIdx, itemIdx, e.target.value)}
                            className="glass border-white/10 text-foreground rounded-xl h-11"
                            placeholder={`Begriff ${itemIdx + 1}`}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={itemIdx === 0}
                            onClick={() => moveOrderItem(qIdx, itemIdx, -1)}
                            className="glass border-white/10 rounded-xl shrink-0"
                            title="Nach oben"
                          >
                            <ArrowLeft className="h-4 w-4 rotate-90" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={itemIdx === (q.orderItems?.length ?? 0) - 1}
                            onClick={() => moveOrderItem(qIdx, itemIdx, 1)}
                            className="glass border-white/10 rounded-xl shrink-0"
                            title="Nach unten"
                          >
                            <ArrowRight className="h-4 w-4 rotate-90" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={(q.orderItems?.length ?? 0) <= 2}
                            onClick={() => removeOrderItem(qIdx, itemIdx)}
                            className="glass border-destructive/20 text-destructive hover:bg-destructive/15 rounded-xl shrink-0"
                            title="Begriff entfernen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOrderItem(qIdx)}
                      className="w-full glass border-white/10 rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Begriff hinzufügen
                    </Button>

                    <div className="rounded-xl border border-primary/15 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Antwort: </span>
                      {(q.orderItems ?? []).filter((item) => item.trim()).join(" → ") ||
                        "Noch keine Begriffe eingetragen"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
