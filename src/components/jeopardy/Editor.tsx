import { QuestionVideoEditor } from "./QuestionVideoEditor";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, GripVertical, ImagePlus, Lightbulb, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEditorAutosave } from "@/lib/autosave/use-editor-autosave";
import { ensureCategoryCount, MAX_CATEGORIES, type LoadedQuiz, type QuizTarget } from "@/lib/quiz-repository";
import type { Category, Question } from "@/lib/jeopardy-data";
import { POINT_VALUES, CATEGORIES } from "@/lib/jeopardy-data";
interface EditorProps {
  source: LoadedQuiz;
  target: QuizTarget;
  onSaved: (source:LoadedQuiz) => void;
  onBack: () => void;
  categoryCount?: number;
  onCategoryCountChange?: (count:number)=>void;
}
export function Editor({
  source, target, onSaved, categoryCount, onCategoryCountChange,
  onBack,
}: EditorProps) {
  const autosave = useEditorAutosave(target,source,onSaved);
  const { value, status, recovery } = autosave.state;
  const draft=value.categories;
  const titleDraft=value.meta.title;
  const subtitleDraft=value.meta.subtitle;
  const setDraft=(next:SetStateAction<Category[]>)=>autosave.update(v=>({...v,categories:typeof next==='function'?next(v.categories):next}));
  const visibleCount = categoryCount ?? draft.length;
  useEffect(()=>{
    if(autosave.state.ready && !recovery.length && draft.length < visibleCount) {
      autosave.update(v=>({...v,categories:ensureCategoryCount(v.categories,visibleCount)}));
    }
  },[autosave.state.ready,recovery.length,draft.length,visibleCount]);
  const setTitleDraft=(title:string)=>autosave.update(v=>({...v,meta:{...v.meta,title}}));
  const setSubtitleDraft=(subtitle:string)=>autosave.update(v=>({...v,meta:{...v.meta,subtitle}}));
  const [validationError,setValidationError]=useState('');
  const [manualSaving,setManualSaving]=useState(false);
  const saving=manualSaving;
  const [activeCat, setActiveCat] = useState(0);
  const [openImageEditors, setOpenImageEditors] = useState<Record<string, boolean>>({});
  const [processingImages, setProcessingImages] = useState<Record<string, boolean>>({});
  const imageGeneration=useRef<Record<string,number>>({});
  const [processingVideos, setProcessingVideos] = useState<Record<string, boolean>>({});
  const videoPending = Object.values(processingVideos).some(Boolean);
  const imagePending=Object.values(processingImages).some(Boolean) || videoPending;
  useEffect(()=>{
    if(!imagePending)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[imagePending]);
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
    const categoryIndex = activeCat;
    const key = `${categoryIndex}-${qIdx}`;
    const generation=(imageGeneration.current[key]??0)+1;imageGeneration.current[key]=generation;
    setProcessingImages((prev) => ({
      ...prev,
      [key]: true,
    }));
    try {
      const imageDataUrl = await fileToOptimizedDataUrl(file);
      await autosave.prepareImage(imageDataUrl);
      if(imageGeneration.current[key]!==generation)return;
      setDraft(prev=>prev.map((c,i)=>i===categoryIndex ? {...c,questions:c.questions.map((q,j)=>j===qIdx?{...q,imageUrl:imageDataUrl}:q)}:c));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      if(imageGeneration.current[key]===generation) setProcessingImages((prev)=>({...prev,[key]:false}));
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
    if(field==='imageUrl') {
      const key=`${activeCat}-${qIdx}`;imageGeneration.current[key]=(imageGeneration.current[key]??0)+1;
      setProcessingImages(prev=>({...prev,[key]:false}));
    }
    updateQuestion(qIdx, (q) => ({ ...q, [field]: value }));
  };
  const updateQValue = (qIdx: number, value: number | undefined) => {
    updateQuestion(qIdx, (q) => ({ ...q, value }));
  };
  const setQuestionType = (qIdx: number, type: NonNullable<Question["type"]>) => {
    updateQuestion(qIdx, (q) => {
      if (type === "choice") {
        return { ...q, type, options: q.options?.length === 4 ? [...q.options] : ["", "", "", ""],
          correctOption: q.correctOption, orderItems: undefined, hints: undefined };
      }
      if (type === "order") {
        const existing = q.orderItems?.length ? q.orderItems : ["", "", "", ""];
        return {
          ...q,
          type: "order",
          orderItems: existing,
          hints: undefined,
          answer: existing.filter(Boolean).join(" → "),
        };
      }
      if (type === "hint") {
        return {
          ...q,
          type: "hint",
          orderItems: undefined,
          hints: q.hints?.length ? q.hints : ["", "", ""],
        };
      }
      return {
        ...q,
        type: "normal",
        orderItems: undefined,
        hints: undefined,
      };
    });
  };
  const updateHint = (qIdx: number, hintIdx: number, value: string) => {
    updateQuestion(qIdx, (q) => {
      const hints = [...(q.hints ?? ["", "", ""] )];
      hints[hintIdx] = value;
      return {
        ...q,
        type: "hint",
        orderItems: undefined,
        hints,
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
  const handleSave=async()=>{
    setManualSaving(true);setValidationError('');
    try { await autosave.flush(); } finally {setManualSaving(false);}
  };
  const handleReset=()=>{
    if(!confirm('Alle Kategorien und Fragen dieses Quiz auf Standard zurücksetzen? Der neue Stand wird automatisch gespeichert.'))return;
    setActiveCat(0);setDraft(structuredClone(CATEGORIES));
  };
  const goBack=async()=>{
    const localSafe=await autosave.localSettled();
    if(!localSafe && !confirm('Die lokale Sicherung ist fehlgeschlagen. Bitte den Entwurf exportieren. Trotzdem verlassen?'))return;
    onBack();
  };
  const statusText={loading:'Lokaler Speicher wird vorbereitet …',saved:'Gespeichert',dirty:'Ungespeicherte Änderungen',saving:'Speichert …',error:'Speichern fehlgeschlagen',conflict:'Online-Konflikt · Entwurf bleibt lokal'}[status];
  if(!autosave.state.ready)return <div className="p-8 text-center" role="status">{statusText}</div>;
  return (
    <div className="min-h-screen p-3 md:p-6 pb-20 md:pb-20 max-w-5xl mx-auto">
      <div className="mb-4 rounded-xl border border-white/10 bg-background/90 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite" className={status==='error'||status==='conflict'?'text-amber-200':'text-muted-foreground'}>{statusText}{autosave.state.dirty && !autosave.state.localError && !autosave.state.localPending ? ' · lokal gesichert' : ''}</p>
          <button type="button" className="text-primary underline underline-offset-4" onClick={autosave.exportDraft}>Entwurf exportieren</button>
        </div>
        {(autosave.state.error||autosave.state.localError||validationError) && <p role="alert" className="mt-2 text-amber-200">{autosave.state.localError || autosave.state.error || validationError}</p>}
        {status==='error' && <Button variant="outline" size="sm" onClick={handleSave} className="mt-2">Erneut speichern</Button>}
        {status==='conflict' && <Button variant="outline" size="sm" className="mt-2" onClick={async()=>{
          if(!confirm('Deinen lokalen Entwurf ausdrücklich anstelle des aktuellen Online-Stands speichern? Andere Änderungen können dabei ersetzt werden. Exportiere deinen Entwurf, wenn du zuerst vergleichen möchtest.'))return;
          try {await autosave.rebase();}catch(e){setValidationError(e instanceof Error?e.message:'Online-Stand konnte nicht geladen werden.');}
        }}>Diesen Entwurf online übernehmen</Button>}
      </div>
      {recovery.length>0 && <section aria-label="Lokale Entwürfe" className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5 space-y-3">
        <h2 className="font-semibold text-lg">Lokaler Entwurf gefunden</h2>
        <p className="text-sm text-muted-foreground">Es gibt noch nicht synchronisierte Änderungen für dieses Quiz. Wähle einen Entwurf, bevor du weiterarbeitest. Auch Entwürfe aus anderen Tabs bleiben getrennt erhalten.</p>
        {recovery.map(record=><div key={record.id} className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
          <span className="text-sm flex-1">{record.value.meta.title || 'Ohne Titel'} · {new Date(record.updatedAt).toLocaleString('de-DE')}</span>
          <Button size="sm" onClick={()=>{setActiveCat(0);autosave.restore(record);}}>Wiederherstellen</Button>
          <Button size="sm" variant="ghost" onClick={()=>{if(confirm('Diesen lokalen Entwurf endgültig verwerfen?'))void autosave.discard(record)?.catch(e=>setValidationError(String(e)));}}>Verwerfen</Button>
        </div>)}
        <Button variant="outline" onClick={autosave.useOnline}>Online-Stand verwenden · Entwürfe behalten</Button>
      </section>}
      <fieldset disabled={recovery.length>0} className="min-w-0">
      <header className="flex items-center justify-between gap-2 mb-6">
        <Button
          disabled={saving || imagePending}
          onClick={goBack}
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
          disabled={saving || imagePending}
          onClick={handleReset}
          className="glass text-destructive hover:bg-destructive/20 border-destructive/30 rounded-xl"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
        {draft.slice(0,visibleCount).map((c, i) => (
          <button
            key={i}
            disabled={videoPending}
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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={videoPending || visibleCount >= MAX_CATEGORIES} onClick={() => {
          if(visibleCount >= MAX_CATEGORIES) return;
          setDraft(v=>ensureCategoryCount(v,visibleCount+1));
          onCategoryCountChange?.(visibleCount+1); setActiveCat(visibleCount);
        }}><Plus className="h-4 w-4" /> Kategorie hinzufügen</Button>
        <span className="text-sm text-muted-foreground" role="status">{visibleCount} von {MAX_CATEGORIES} Kategorien{draft.length > visibleCount ? ` · ${draft.length-visibleCount} weitere bleiben gespeichert` : ''}</span>
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
            placeholder="Nowotnick Quiz"
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
            placeholder="Quiz halt"
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
            const isChoice = q.type === "choice";
            const isHint = q.type === "hint";
            const imageEditorKey = `${activeCat}-${qIdx}`;
            const imageEditorOpen = Boolean(openImageEditors[imageEditorKey]);
            const hasImage = Boolean(q.imageUrl?.trim());
            const hasVideo = Boolean(q.videoUrl?.trim());
            const videoProcessing = Boolean(processingVideos[imageEditorKey]);
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
                  <div className="ml-auto flex flex-wrap rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => setQuestionType(qIdx, "normal")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        !isOrder && !isHint && !isChoice
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
                    <button
                      type="button"
                      onClick={() => setQuestionType(qIdx, "hint")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isHint
                          ? "bg-amber-500 text-amber-950"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      Hinweis
                    </button>
                    <button type="button" onClick={() => setQuestionType(qIdx, "choice")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${isChoice ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      ABCD
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
                    disabled={videoProcessing}
                    aria-expanded={imageEditorOpen}
                    aria-controls={`media-${source.id}-${imageEditorKey}`}
                    className={`
                      max-w-full
                      inline-flex items-center gap-3
                      rounded-xl
                      border
                      px-3 py-2
                      text-xs
                      transition-all
                      ${
                        hasImage || hasVideo
                          ? "border-primary/20 bg-primary/[0.04] text-foreground/80 hover:bg-primary/[0.08]"
                          : "border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" />
                      {hasImage && hasVideo ? "Bild und Video vorhanden" : hasImage ? "Bild vorhanden" : hasVideo ? "Video vorhanden" : "Medien hinzufügen · Bild oder Video"}
                    </span>
                    {imageEditorOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {imageEditorOpen && (
                    <div id={`media-${source.id}-${imageEditorKey}`} className="rounded-2xl border border-white/10 bg-black/10 p-3 space-y-3">
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
                <QuestionVideoEditor key={`video-${source.id}-${activeCat}-${qIdx}`} quizId={source.id} value={q.videoUrl}
                  onChange={url => updateQuestion(qIdx, current => ({...current, videoUrl: url}))}
                  onPending={pending => setProcessingVideos(prev => ({...prev, [`${activeCat}-${qIdx}`]: pending}))} />
                      <div className="flex gap-2">
                        {hasImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              updateQ(qIdx, "imageUrl", "");

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
                          disabled={videoProcessing}
                          onClick={() => closeImageEditor(qIdx)}
                          className="ml-auto glass border-white/10 rounded-xl"
                        >
                          Fertig
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {isChoice ? (
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-semibold">Antworten A–D</legend>
                    <p className="text-xs text-muted-foreground">Trage vier Antworten ein und markiere die richtige Lösung.</p>
                    {["A", "B", "C", "D"].map((letter, optionIndex) => (
                      <div key={letter} className="flex items-center gap-3">
                        <label className="flex shrink-0 items-center gap-2 font-bold">
                          <input type="radio" name={`correct-${activeCat}-${qIdx}`}
                            aria-label={`Antwort ${letter} ist richtig`}
                            checked={q.correctOption === optionIndex}
                            onChange={() => updateQuestion(qIdx, question => ({ ...question, correctOption: optionIndex }))} />
                          {letter}
                        </label>
                        <Textarea rows={2} aria-label={`Antwort ${letter}`} value={q.options?.[optionIndex] ?? ""}
                          className="glass border-white/10 rounded-xl"
                          onChange={event => updateQuestion(qIdx, question => {
                            const options = [...(question.options ?? ["", "", "", ""])];
                            options[optionIndex] = event.target.value;
                            return { ...question, options };
                          })} />
                      </div>
                    ))}
                  </fieldset>
                ) : !isOrder ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                        Antwort
                      </Label>
                      <Textarea
                        rows={4}
                        value={q.answer}
                        onChange={(e) => updateQ(qIdx, "answer", e.target.value)}
                        className="glass border-white/10 text-foreground rounded-xl mt-1 min-h-28 resize-y"
                      />
                    </div>
                    {isHint && (
                      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.035] p-3 space-y-3">
                        <div className="flex items-center gap-2 text-amber-300/90">
                          <Lightbulb className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                            Hinweise
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          Jeder verwendete Hinweis zieht 20 % vom ursprünglichen Punktwert ab.
                        </p>
                        {(q.hints ?? ["", "", ""]).slice(0, 3).map((hint, hintIdx) => (
                          <div key={hintIdx}>
                            <Label className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                              Hinweis {hintIdx + 1}
                            </Label>
                            <Textarea
                              value={hint}
                              onChange={(e) => updateHint(qIdx, hintIdx, e.target.value)}
                              rows={2}
                              className="glass border-white/10 text-foreground rounded-xl mt-1"
                              placeholder={`Optionaler Hinweis ${hintIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
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
        {validationError && <p role="alert" className="text-destructive">{validationError}</p>}
        <Button
          disabled={saving || imagePending}
          onClick={handleSave}
          size="lg"
          className="w-full font-display text-lg md:text-xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0"
        >
          {saving ? "Wird gespeichert …" : "Jetzt speichern"}
        </Button>
      </div>
      </fieldset>
    </div>
  );
}
