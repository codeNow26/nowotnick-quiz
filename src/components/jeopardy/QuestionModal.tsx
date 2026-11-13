import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Timer,
  X,
  Eye,
  GripVertical,
  Maximize2,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { hasValidChoices, playerColor, type QuestionResult, type Question } from "@/lib/jeopardy-data";
interface QuestionModalProps {
  open: boolean;
  review?: QuestionResult;
  question: Question | null;
  value: number;
  category: string;
  players: { name: string; score: number; color?:string }[];
  onResolve: (
    playerIndex: number | null,
    correct: boolean,
    resolvedValue: number,
    selectedChoice?: number | null
  ) => void;
  onClose: () => void;
}
function shuffleItems(items: string[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (
    shuffled.length > 1 &&
    shuffled.every((item, index) => item === items[index])
  ) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}
export function QuestionModal(props: QuestionModalProps) {
  const lastOpen = useRef(props);
  useEffect(() => { if(props.open && props.question) lastOpen.current = props; }, [props]);
  const content = props.open ? props : lastOpen.current;
  return <QuestionModalContent {...content} open={props.open} onClose={props.onClose} onResolve={props.onResolve} />;
}
function QuestionModalContent({
  open,
  review,
  question,
  value,
  category,
  players,
  onResolve,
  onClose,
}: QuestionModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) contentRef.current?.scrollTo({ top: 0 });
  }, [open, question]);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [revealed]);
  const [selectedPlayer, setSelectedPlayer] =
    useState<number | null>(null);
  const [timeLeft, setTimeLeft] =
    useState<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const lockedChoiceRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  const [orderedItems, setOrderedItems] =
    useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);
  const [imageExpanded, setImageExpanded] =
    useState(false);
  const [revealedHintCount, setRevealedHintCount] =
    useState(0);
  useEffect(() => {
    if (open) {
      setRevealed(Boolean(review));
      setSelectedPlayer(
        players.length === 1 ? 0 : null
      );
      setTimeLeft(null);
      setSelectedChoice(null);
      lockedChoiceRef.current = null;
      resolvedRef.current = false;
      setDraggedIndex(null);
      setImageExpanded(false);
      setRevealedHintCount(0);
      if (
        question?.type === "order" &&
        (question.orderItems?.length ?? 0) >= 2
      ) {
        setOrderedItems(
          shuffleItems(question.orderItems ?? [])
        );
      } else {
        setOrderedItems([]);
      }
    }
  }, [open, players.length, question, review]);
  useEffect(() => {
    if (
      !open || timeLeft === null ||
      timeLeft <= 0
    ) {
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev === null) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, open]);
  useEffect(() => {
    if (!imageExpanded) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageExpanded]);
  if (!question) {
    return null;
  }
  const isOrderQuestion =
    question.type === "order" &&
    (question.orderItems?.length ?? 0) >= 2;
  const correctOrder = question.orderItems ?? [];
  const orderIsCorrect =
    isOrderQuestion &&
    orderedItems.length === correctOrder.length &&
    orderedItems.every(
      (item, index) => item === correctOrder[index]
    );
  const availableHints =
    question.type === "hint"
      ? (question.hints ?? []).filter((hint) => hint.trim())
      : [];
  const isHintQuestion =
    question.type === "hint" && availableHints.length > 0;
  const currentValue = Math.max(
    0,
    Math.round(value * (1 - revealedHintCount * 0.2))
  );
  const isChoiceQuestion = question.type === "choice";
  const validChoices = hasValidChoices(question);
  const commitResult = (player: number | null, correct: boolean) => {
    if (!open || review || resolvedRef.current) return;
    resolvedRef.current = true;
    onResolve(player, correct, currentValue, selectedChoice);
  };
  const moveOrderItem = (
    from: number,
    to: number
  ) => {
    if (
      revealed ||
      to < 0 ||
      to >= orderedItems.length ||
      from === to
    ) {
      return;
    }
    setOrderedItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) {
      return;
    }
    moveOrderItem(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };
  const timerClass =
    timeLeft !== null &&
    timeLeft <= 5
      ? "text-destructive scale-110"
      : timeLeft !== null &&
          timeLeft <= 10
        ? "text-orange-400"
        : "text-primary";
  const timerProgress =
    timeLeft === null
      ? 0
      : Math.min(
          100,
          Math.max(0, timeLeft)
        );
  const renderQuestionImage = () => {
    if (!question.imageUrl?.trim()) {
      return null;
    }
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setImageExpanded(true)}
          className="group relative mx-auto block max-w-full cursor-zoom-in"
          title="Bild vergrößern"
        >
          <img
            key={question.imageUrl}
            src={question.imageUrl}
            alt="Fragenbild"
            referrerPolicy="no-referrer"
            className="
              mx-auto
              max-h-48
              md:max-h-56
              max-w-full
              rounded-2xl
              border
              border-white/10
              bg-black/20
              object-contain
              shadow-[0_16px_45px_-20px_rgba(0,0,0,0.8)]
              transition-all
              duration-200
              group-hover:border-primary/40
              group-hover:brightness-110
            "
            onError={(event) => {
              const button = event.currentTarget.parentElement;
              if (button) {
                button.style.display = "none";
              }
            }}
          />
          <span
            className="
              absolute
              bottom-2 right-2
              flex
              h-8 w-8
              items-center justify-center
              rounded-lg
              border border-white/10
              bg-black/60
              text-white/80
              backdrop-blur-sm
              transition-all
              group-hover:bg-primary/80
              group-hover:text-white
            "
          >
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>
      </div>
    );
  };
  const imageOverlay =
    imageExpanded &&
    question.imageUrl?.trim() &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="
              fixed inset-0 z-[9999]
              flex items-center justify-center
              bg-black/90
              p-4 md:p-8
              backdrop-blur-md
              cursor-pointer
              pointer-events-auto
            "
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setImageExpanded(false)}
          >
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setImageExpanded(false);
              }}
              className="
                fixed top-4 right-4
                z-[10000]
                flex h-11 w-11
                items-center justify-center
                rounded-full
                border border-white/15
                bg-black/60
                text-white
                backdrop-blur-md
                transition-all
                hover:bg-white/15
              "
              aria-label="Bild schließen"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              role="button"
              tabIndex={0}
              aria-label="Vergrößertes Bild schließen"
              onKeyDown={event => { if(event.key === 'Enter' || event.key === ' ') {event.preventDefault();setImageExpanded(false);} }}
              src={question.imageUrl}
              alt="Fragenbild vergrößert"
              referrerPolicy="no-referrer"
              className="
                max-h-[92vh]
                max-w-[94vw]
                rounded-2xl
                border border-white/10
                bg-black
                object-contain
                shadow-[0_30px_100px_rgba(0,0,0,0.75)]
                cursor-pointer
              "
              onClick={(event) => {
                event.stopPropagation();
                setImageExpanded(false);
              }}
            />
          </div>,
          document.body
        )
      : null;
  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && imageExpanded) {
          setImageExpanded(false);
          return;
        }
        if (!o) {
          onClose();
        }
      }}
    >
      <DialogContent
        motion="question"
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => {
          if (imageExpanded) {
            event.preventDefault();
            setImageExpanded(false);
          }
        }}
        onPointerDownOutside={(event) => {
          if (imageExpanded) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (imageExpanded) {
            event.preventDefault();
          }
        }}
        className="
          question-dialog max-w-4xl
          p-0
          overflow-hidden
          rounded-[1.75rem]
          border border-white/[0.12]
          bg-background/95
          text-foreground
          backdrop-blur-2xl
          shadow-[0_25px_100px_-20px_rgba(0,0,0,0.8),0_0_60px_-20px_var(--indigo-glow)]
        "
      >
        <DialogTitle className="sr-only">{category} – Quizfrage</DialogTitle>
        {/* HEADER */}
        <div
          className="
            question-dialog-header relative
            px-4 py-3 pr-12
            md:px-6 md:py-4 md:pr-12
            flex
            items-center
            justify-between
            border-b
            border-white/[0.08]
            bg-gradient-to-r
            from-primary/[0.08]
            via-transparent
            to-primary/[0.08]
          "
        >
          <div
            className="
              absolute
              left-1/2 top-0
              -translate-x-1/2
              w-1/2 h-px
              bg-gradient-to-r
              from-transparent
              via-primary/60
              to-transparent
            "
          />
          {/* Kategorie */}
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                h-2 w-2
                rounded-full
                bg-primary
                shadow-[0_0_12px_var(--indigo-glow)]
              "
            />
            <span
              className="
                font-sans font-bold break-words
                text-sm md:text-base
                text-foreground/90
              "
            >
              {category}
            </span>
          </div>
          {/* Punktwert */}
          <div
            className="
              relative
              min-w-[72px]
              rounded-xl
              border
              border-primary/30
              bg-primary/[0.10]
              px-4 py-2
              text-center
              shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_20px_-8px_var(--indigo-glow)]
            "
          >
            <span
              className="
                font-display
                text-xl md:text-2xl
                text-primary
              "
              style={{
                textShadow:
                  "0 0 20px oklch(0.55 0.24 278 / 0.75)",
              }}
            >
              {currentValue}
            </span>
          </div>
        </div>
        {/* FRAGE / ANTWORT */}
        <div
          ref={contentRef}
          tabIndex={0}
          role="region"
          aria-label={revealed ? "Antwort" : "Frage"}
          className="
            question-dialog-body relative
            px-5 py-10 md:px-10 md:py-12
            text-center
          "
        >
          {/* Hintergrundlicht */}
          <div
            className={`
              absolute
              left-1/2 top-1/2
              -translate-x-1/2
              -translate-y-1/2
              h-48 w-[70%]
              rounded-full
              blur-[80px]
              pointer-events-none
              transition-all
              duration-500
              ${
                revealed
                  ? "bg-emerald-500/[0.07]"
                  : "bg-primary/[0.08]"
              }
            `}
          />
          {/* kleine Bezeichnung nach Reveal */}
          {revealed && !review && (
            <div
              className="
                absolute
                top-5
                left-1/2
                -translate-x-1/2
                flex
                items-center
                gap-2
                text-[10px]
                md:text-xs
                uppercase
                tracking-[0.25em]
                text-emerald-400/80
                animate-in
                fade-in
                slide-in-from-top-2
                duration-300
              "
            >
              <Check className="h-3.5 w-3.5" />
              Antwort
            </div>
          )}
          {review ? (
            <div className="relative z-10 w-full max-w-2xl space-y-6 text-left">
              <p className="text-sm text-muted-foreground">Nachlesen · {review.playerIndex === null ? "Übersprungen" : `${players[review.playerIndex]?.name}: ${review.correct ? "richtig beantwortet" : "falsch beantwortet"}`}</p>
              {renderQuestionImage()}
              <section><h3 className="mb-2 text-sm font-semibold text-muted-foreground">Frage</h3>
                <p className="whitespace-pre-wrap break-words text-xl md:text-3xl font-bold">{question.question}</p>
              </section>
              {isChoiceQuestion && validChoices ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options!.map((option, index) => (
                    <div key={index} className={`rounded-xl border p-4 whitespace-pre-wrap break-words ${index === question.correctOption ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10"}`}>
                      <b>{"ABCD"[index]}: </b>{option}
                      {index === question.correctOption && <span className="block mt-2 text-sm text-emerald-300">✓ Richtige Antwort</span>}
                      {index === review.selectedChoice && <span className="block mt-2 text-sm text-amber-300">Eingeloggt</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <section><h3 className="mb-2 text-sm font-semibold text-emerald-300">Antwort</h3>
                  <p className="whitespace-pre-wrap break-words text-xl md:text-3xl">{question.type === "order" ? question.orderItems?.join(" → ") : question.answer}</p>
                </section>
              )}
            </div>
          ) : isChoiceQuestion ? (
            <div className="relative z-10 w-full max-w-2xl space-y-6">
              {renderQuestionImage()}
              <p className="font-sans font-bold text-2xl md:text-4xl leading-snug whitespace-pre-line">
                {question.question}
              </p>
              {!validChoices ? (
                <p role="alert" className="text-amber-300">Diese ABCD-Frage ist unvollständig. Bitte vier Antworten und die richtige Lösung im Editor hinterlegen.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {question.options!.map((option, index) => {
                    const chosen = selectedChoice === index;
                    const correct = revealed && question.correctOption === index;
                    const wrong = revealed && chosen && !correct;
                    return (
                      <button key={index} type="button"
                        aria-pressed={chosen}
                        aria-label={`Antwort ${"ABCD"[index]}: ${option}`}
                        disabled={selectedChoice !== null || revealed}
                        onClick={() => {
                          if (lockedChoiceRef.current !== null) return;
                          lockedChoiceRef.current = index;
                          setSelectedChoice(index);
                          setTimeLeft(null);
                        }}
                        className={`quiz-choice flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${correct
                          ? "border-emerald-300 bg-emerald-600 text-white"
                          : wrong ? "border-red-300 bg-red-800 text-white"
                          : chosen ? "border-amber-300 bg-amber-500 text-slate-950"
                          : "border-indigo-400/50 bg-gradient-to-b from-indigo-950 to-slate-950 text-white enabled:hover:border-amber-300"}`}>
                        <span className="shrink-0 font-display text-lg">{"ABCD"[index]}:</span>
                        <span className="min-w-0 break-words whitespace-pre-wrap">{option}</span>
                        {correct && <Check className="ml-auto h-5 w-5 shrink-0" />}
                        {wrong && <X className="ml-auto h-5 w-5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {revealed ? (selectedChoice === question.correctOption ? "Richtig beantwortet!" : `Richtig ist Antwort ${"ABCD"[question.correctOption ?? 0]}.`)
                  : selectedChoice !== null ? `Antwort ${"ABCD"[selectedChoice]} ist eingeloggt.`
                  : "Klicke auf eine Antwort, um sie verbindlich einzuloggen."}
              </p>
            </div>
          ) : isOrderQuestion ? (
            <div
              className="
                relative z-10
                w-full
                max-w-2xl
              "
            >
              {renderQuestionImage()}
              {!revealed ? (
                <>
                  <p
                    className="
                      font-sans font-bold
                  leading-snug
                      whitespace-pre-line
                      text-2xl md:text-4xl
                      text-foreground
                      animate-in
                      fade-in
                      zoom-in-95
                      duration-300
                    "
                    style={{
                      textShadow:
                        "0 3px 30px rgba(0,0,0,0.35)",
                    }}
                  >
                    {question.question.replace(
                      /\s+(?=[A-D](?::|\.{1,2}|\)))/g,
                      "\n"
                    )}
                  </p>
                  <div className="mt-8 space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.18em]">
                      Ziehen oder mit den Pfeilen verschieben
                    </p>
                    <div className="flex flex-wrap items-stretch justify-center gap-2">
                      {orderedItems.map(
                        (item, index) => (
                          <div
                            key={`${item}-${index}`}
                            draggable
                            onDragStart={() =>
                              setDraggedIndex(index)
                            }
                            onDragEnd={() =>
                              setDraggedIndex(null)
                            }
                            onDragOver={(event) =>
                              event.preventDefault()
                            }
                            onDrop={() =>
                              handleDrop(index)
                            }
                            className={`
                              flex
                              items-center
                              gap-1
                              rounded-xl
                              border
                              bg-white/[0.05]
                              px-2 py-2
                              transition-all
                              duration-200
                              ${
                                draggedIndex === index
                                  ? "border-primary/70 opacity-50"
                                  : "border-white/10 hover:border-primary/40 hover:bg-primary/[0.08]"
                              }
                            `}
                          >
                            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                            <button
                              type="button"
                              onClick={() =>
                                moveOrderItem(
                                  index,
                                  index - 1
                                )
                              }
                              disabled={index === 0}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20"
                              title="Nach links"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <span className="px-2 py-1 font-semibold normal-case whitespace-nowrap">
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                moveOrderItem(
                                  index,
                                  index + 1
                                )
                              }
                              disabled={
                                index ===
                                orderedItems.length - 1
                              }
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20"
                              title="Nach rechts"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div
                    className={`
                      mx-auto
                      inline-flex
                      rounded-xl
                      border
                      px-4 py-2
                      text-sm
                      font-semibold
                      ${
                        orderIsCorrect
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }
                    `}
                  >
                    {orderIsCorrect
                      ? "✓ Reihenfolge stimmt!"
                      : "✗ Nicht ganz – richtige Reihenfolge:"}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {correctOrder.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <span className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-2.5 font-semibold">
                            {item}
                          </span>
                          {index <
                            correctOrder.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-emerald-400/60" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-2xl">
              {renderQuestionImage()}
              <p
                key={revealed ? "answer" : "question"}
                className={`
                  relative z-10
                  font-sans font-bold
                  leading-snug
                  whitespace-pre-line
                  max-w-2xl
                  animate-in
                  fade-in
                  zoom-in-95
                  duration-300
                  ${
                    revealed
                      ? "text-2xl md:text-4xl text-foreground"
                      : "text-2xl md:text-4xl text-foreground"
                  }
                `}
                style={{
                  textShadow:
                    "0 3px 30px rgba(0,0,0,0.35)",
                }}
              >
                {revealed
                  ? question.answer
                  : question.question.replace(
                      /\s+(?=[A-D](?::|\.{1,2}|\)))/g,
                      "\n"
                    )}
              </p>
              {!revealed && isHintQuestion && revealedHintCount > 0 && (
                <div className="mt-6 space-y-2">
                  {availableHints.slice(0, revealedHintCount).map((hint, index) => (
                    <div
                      key={`${hint}-${index}`}
                      className="mx-auto max-w-xl rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm md:text-base text-foreground/90"
                    >
                      <span className="mr-2 text-amber-300 font-semibold">
                        Hinweis {index + 1}:
                      </span>
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* CONTROLS */}
        <div
          className="
            question-dialog-controls relative
            p-3 md:p-4 space-y-3
            border-t
            border-white/[0.08]
            bg-gradient-to-b
            from-white/[0.035]
            to-primary/[0.045]
          "
        >

          {review ? (
            <Button onClick={onClose} className="w-full rounded-xl">Zurück zum Spielfeld</Button>
          ) : <>
          {revealed && players.length > 1 && (
            <div>
              <p className="mb-2 text-center text-sm text-muted-foreground">Wer bekommt die Punkte?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((player, index) => (
                  <button key={index} type="button"
                    aria-pressed={selectedPlayer === index}
                    onClick={() => setSelectedPlayer(index)}
                    className={`rounded-xl border px-4 py-2 font-semibold transition-colors ${selectedPlayer === index ? "border-primary bg-primary text-primary-foreground" : "border-white/15 bg-white/5 text-foreground"}`}>
                    <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: playerColor(index, player.color) }} />
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!revealed && (!isChoiceQuestion || selectedChoice === null) && (
            <>
              {/* TIMER */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[20, 30, 60].map(
                    (seconds) => (
                      <Button
                        key={seconds}
                        variant="outline"
                        onClick={() =>
                          setTimeLeft(
                            seconds
                          )
                        }
                        className={`
                          rounded-xl
                          border-white/10
                          transition-all
                          duration-200
                          ${
                            timeLeft ===
                            seconds
                              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-6px_var(--indigo-glow)]"
                              : "bg-white/[0.03] hover:bg-white/[0.08]"
                          }
                        `}
                      >
                        <Timer className="mr-2 h-4 w-4" />
                        {seconds === 60
                          ? "1 Min."
                          : `${seconds} Sek.`}
                      </Button>
                    )
                  )}
                  {timeLeft !== null && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setTimeLeft(null)
                      }
                      className="
                        rounded-xl
                        text-muted-foreground
                        hover:text-foreground
                        hover:bg-white/[0.05]
                      "
                    >
                      Timer aus
                    </Button>
                  )}
                </div>
                {timeLeft !== null && (
                  <div className="space-y-2">
                    <div
                      className={`
                        text-center
                        font-display
                        text-4xl md:text-5xl
                        font-bold
                        transition-all
                        duration-300
                        ${timerClass}
                      `}
                    >
                      {timeLeft === 0
                        ? "ZEIT!"
                        : timeLeft}
                    </div>
                    {/* rein visuelle Timer-Linie */}
                    <div
                      className="
                        mx-auto
                        h-1
                        max-w-xs
                        overflow-hidden
                        rounded-full
                        bg-white/[0.07]
                      "
                    >
                      <div
                        className={`
                          h-full
                          rounded-full
                          transition-all
                          duration-1000
                          ${
                            timeLeft <= 5
                              ? "bg-destructive"
                              : timeLeft <=
                                  10
                                ? "bg-orange-400"
                                : "bg-primary"
                          }
                        `}
                        style={{
                          width: `${timerProgress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

            </>
          )}
          {!revealed && isHintQuestion && (
            <div className="flex justify-center">
              <Button type="button" variant="outline"
                disabled={revealedHintCount >= availableHints.length}
                onClick={() => setRevealedHintCount(count => Math.min(count + 1, availableHints.length))}
                className="rounded-xl border-amber-400/20 text-amber-200">
                <Lightbulb className="mr-2 h-4 w-4" />
                {revealedHintCount < availableHints.length ? "Nächster Hinweis (−20 %)" : "Alle Hinweise verwendet"}
              </Button>
            </div>
          )}
          {!revealed ? (
            <Button
              disabled={isChoiceQuestion && (!validChoices || selectedChoice === null)}
              onClick={() => { setTimeLeft(null); setRevealed(true); }}
              size="lg"
              className="quiz-action w-full rounded-2xl bg-primary py-6 font-display text-lg text-white">
              <Eye className="mr-2 h-5 w-5" />
              {isChoiceQuestion ? "Antwort auflösen" : isOrderQuestion ? "Reihenfolge prüfen" : "Antwort zeigen"}
            </Button>
          ) : isChoiceQuestion ? (
            <Button onClick={() => commitResult(selectedPlayer, selectedChoice === question.correctOption)}
              disabled={selectedPlayer === null || selectedChoice === null}
              size="lg" className="quiz-action w-full rounded-2xl py-6 font-display">
              Punkte übernehmen & weiter
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => commitResult(selectedPlayer, false)} disabled={selectedPlayer === null}
                size="lg" className="rounded-2xl bg-destructive py-6 text-white hover:bg-destructive/90">
                <X className="mr-2 h-5 w-5" /> Falsch
              </Button>
              <Button onClick={() => commitResult(selectedPlayer, true)} disabled={selectedPlayer === null}
                size="lg" className="rounded-2xl bg-emerald-500 py-6 text-emerald-950 hover:bg-emerald-400">
                <Check className="mr-2 h-5 w-5" /> Richtig
              </Button>
            </div>
          )}
          <button type="button" onClick={() => commitResult(null, false)}
            className="w-full py-1 text-xs text-muted-foreground hover:text-foreground">
            Überspringen (keine Punkte)
          </button>
          </>}
        </div>
      </DialogContent>
    </Dialog>
    {imageOverlay}
    </>
  );
}