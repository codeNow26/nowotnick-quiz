import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {

  ArrowLeft,

  ArrowRight,

  Check,

  Timer,

  X,

  Hand,

  Eye,

  GripVertical,

  Maximize2,

  Trophy,

} from "lucide-react";

import type { Question } from "@/lib/jeopardy-data";



interface QuestionModalProps {

  open: boolean;

  question: Question | null;

  value: number;

  category: string;

  players: { name: string; score: number }[];

  onResolve: (

    playerIndex: number | null,

    correct: boolean,

    coGuessers: number[],

    correctCoGuessers: number[]

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



export function QuestionModal({

  open,

  question,

  value,

  category,

  players,

  onResolve,

  onClose,

}: QuestionModalProps) {

  const [revealed, setRevealed] = useState(false);



  const [selectedPlayer, setSelectedPlayer] =

    useState<number | null>(null);



  const [timeLeft, setTimeLeft] =

    useState<number | null>(null);



  const [coGuessers, setCoGuessers] =

    useState<number[]>([]);



  const [

    correctCoGuessers,

    setCorrectCoGuessers,

  ] = useState<number[]>([]);


  const [orderedItems, setOrderedItems] =

    useState<string[]>([]);



  const [draggedIndex, setDraggedIndex] =

    useState<number | null>(null);



  const [imageExpanded, setImageExpanded] =

    useState(false);



  useEffect(() => {

    if (open) {

      setRevealed(false);



      setSelectedPlayer(

        players.length === 1 ? 0 : null

      );



      setTimeLeft(null);

      setCoGuessers([]);

      setCorrectCoGuessers([]);

      setDraggedIndex(null);

      setImageExpanded(false);



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

  }, [open, players.length, question]);



  useEffect(() => {

    if (

      timeLeft === null ||

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

  }, [timeLeft]);



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



  const toggleCoGuesser = (

    playerIndex: number

  ) => {

    setCoGuessers((prev) =>

      prev.includes(playerIndex)

        ? prev.filter(

            (index) =>

              index !== playerIndex

          )

        : [...prev, playerIndex]

    );



    setCorrectCoGuessers((prev) =>

      prev.filter(

        (index) =>

          index !== playerIndex

      )

    );

  };



  const toggleCorrectCoGuesser = (

    playerIndex: number

  ) => {

    setCorrectCoGuessers((prev) =>

      prev.includes(playerIndex)

        ? prev.filter(

            (index) =>

              index !== playerIndex

          )

        : [...prev, playerIndex]

    );

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

              cursor-zoom-out

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

                cursor-default

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

          max-w-3xl

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

        {/* HEADER */}

        <div

          className="

            relative

            px-6 py-4

            md:px-8 md:py-5

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

          <div className="flex items-center gap-3">

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

                font-display

                text-sm md:text-base

                uppercase

                tracking-[0.22em]

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

              {value}

            </span>

          </div>

        </div>



        {/* FRAGE / ANTWORT */}

        <div

          className="

            relative

            min-h-64

            md:min-h-[310px]

            px-7 py-10

            md:px-12 md:py-14

            flex

            items-center

            justify-center

            text-center

            overflow-hidden

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

          {revealed && (

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



          {isOrderQuestion ? (

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

                      font-display

                      uppercase

                      leading-[1.15]

                      whitespace-pre-line

                      text-2xl md:text-[2.6rem]

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

                      /\s+(?=[A-D]:)/g,

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

                  font-display

                  uppercase

                  leading-[1.15]

                  whitespace-pre-line

                  max-w-2xl

                  animate-in

                  fade-in

                  zoom-in-95

                  duration-300



                  ${

                    revealed

                      ? "text-2xl md:text-4xl text-foreground"

                      : "text-2xl md:text-[2.6rem] text-foreground"

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

                      /\s+(?=[A-D]:)/g,

                      "\n"

                    )}

              </p>

            </div>

          )}

        </div>



        {/* CONTROLS */}

        <div

          className="

            relative

            p-4 md:p-6

            space-y-5

            border-t

            border-white/[0.08]

            bg-gradient-to-b

            from-white/[0.035]

            to-primary/[0.045]

          "

        >

          {!revealed && (

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



              {/* MITRATER */}

              {players.length > 1 && (

                <div

                  className="

                    pt-1

                    rounded-2xl

                  "

                >

                  <p

                    className="

                      text-xs

                      text-muted-foreground

                      mb-3

                      text-center

                      uppercase

                      tracking-[0.2em]

                    "

                  >

                    <Hand className="inline-block mr-2 h-4 w-4" />

                    Wer rät mit?

                  </p>



                  <div className="flex flex-wrap gap-2 justify-center">

                    {players.map(

                      (

                        player,

                        index

                      ) => {

                        const active =

                          coGuessers.includes(

                            index

                          );



                        return (

                          <button

                            key={index}

                            onClick={() =>

                              toggleCoGuesser(

                                index

                              )

                            }

                            className={`

                              px-4 py-2.5

                              rounded-xl

                              font-semibold

                              transition-all

                              duration-200

                              border



                              ${

                                active

                                  ? `

                                    bg-amber-500

                                    text-amber-950

                                    border-amber-300

                                    scale-[1.04]

                                    shadow-[0_0_22px_-6px_rgba(245,158,11,0.7)]

                                  `

                                  : `

                                    bg-white/[0.035]

                                    border-white/[0.08]

                                    text-foreground/75

                                    hover:text-foreground

                                    hover:bg-white/[0.08]

                                    hover:border-white/[0.15]

                                  `

                              }

                            `}

                          >

                            {active &&

                              "🙋 "}



                            {player.name}

                          </button>

                        );

                      }

                    )}

                  </div>



                  <p className="text-xs text-muted-foreground/70 mt-2.5 text-center">

                    Mitrater: richtig +25 % · falsch −25 %

                  </p>

                </div>

              )}

            </>

          )}



          {/* REVEAL */}

          {!revealed ? (

            <Button

              onClick={() =>

                setRevealed(true)

              }

              size="lg"

              className="

                group

                relative

                overflow-hidden

                w-full

                py-7

                rounded-2xl

                border

                border-primary/40

                bg-gradient-to-r

                from-primary

                via-violet-600

                to-primary

                font-display

                text-lg md:text-xl

                text-white

                uppercase

                tracking-[0.14em]

                shadow-[0_0_30px_-8px_var(--indigo-glow)]

                transition-all

                duration-300

                hover:scale-[1.01]

                hover:shadow-[0_0_40px_-5px_var(--indigo-glow)]

              "

            >

              <div

                className="

                  absolute

                  inset-0

                  bg-gradient-to-r

                  from-transparent

                  via-white/[0.08]

                  to-transparent

                  -translate-x-full

                  group-hover:translate-x-full

                  transition-transform

                  duration-700

                "

              />



              <Eye className="relative z-10 mr-2 h-5 w-5" />



              <span className="relative z-10">

                {isOrderQuestion

                  ? "Reihenfolge prüfen"

                  : "Antwort zeigen"}

              </span>

            </Button>

          ) : (

            <>

              {/* HAUPTANTWORT */}

              {players.length > 1 && (

                <div>

                  <p

                    className="

                      text-xs

                      text-muted-foreground

                      mb-3

                      text-center

                      uppercase

                      tracking-[0.2em]

                    "

                  >

                    <Trophy className="inline-block mr-2 h-4 w-4" />

                    Wer hat die Hauptantwort gegeben?

                  </p>



                  <div className="flex flex-wrap gap-2 justify-center">

                    {players.map(

                      (

                        player,

                        index

                      ) => {

                        const isCoGuesser =

                          coGuessers.includes(

                            index

                          );



                        return (

                          <button

                            key={index}

                            disabled={

                              isCoGuesser

                            }

                            onClick={() =>

                              setSelectedPlayer(

                                index

                              )

                            }

                            className={`

                              px-4 py-2.5

                              rounded-xl

                              font-semibold

                              transition-all

                              duration-200

                              border



                              ${

                                isCoGuesser

                                  ? `

                                    opacity-30

                                    cursor-not-allowed

                                    bg-white/[0.03]

                                    border-white/[0.06]

                                    text-foreground/50

                                  `

                                  : selectedPlayer ===

                                      index

                                    ? `

                                      bg-primary

                                      text-primary-foreground

                                      border-primary

                                      scale-[1.04]

                                      shadow-[0_0_24px_-6px_var(--indigo-glow)]

                                    `

                                    : `

                                      bg-white/[0.035]

                                      border-white/[0.08]

                                      text-foreground/80

                                      hover:text-foreground

                                      hover:bg-white/[0.08]

                                    `

                              }

                            `}

                            title={

                              isCoGuesser

                                ? "Dieser Spieler ist als Mitrater angemeldet"

                                : undefined

                            }

                          >

                            {player.name}



                            {isCoGuesser &&

                              " · Mitrater"}

                          </button>

                        );

                      }

                    )}

                  </div>

                </div>

              )}



              {/* MITRATER AUSWERTUNG */}

              {coGuessers.length >

                0 && (

                <div

                  className="

                    rounded-2xl

                    border

                    border-amber-500/20

                    bg-amber-500/[0.04]

                    p-4

                  "

                >

                  <p

                    className="

                      text-xs

                      text-muted-foreground

                      mb-3

                      text-center

                      uppercase

                      tracking-[0.2em]

                    "

                  >

                    Welche Mitrater waren richtig?

                  </p>



                  <div className="flex flex-wrap gap-2 justify-center">

                    {coGuessers.map(

                      (

                        playerIndex

                      ) => {

                        const correct =

                          correctCoGuessers.includes(

                            playerIndex

                          );



                        return (

                          <button

                            key={

                              playerIndex

                            }

                            onClick={() =>

                              toggleCorrectCoGuesser(

                                playerIndex

                              )

                            }

                            className={`

                              px-4 py-2.5

                              rounded-xl

                              font-semibold

                              transition-all

                              duration-200

                              border



                              ${

                                correct

                                  ? `

                                    bg-emerald-500

                                    text-emerald-950

                                    border-emerald-300

                                    shadow-[0_0_18px_-7px_rgba(16,185,129,0.8)]

                                  `

                                  : `

                                    bg-destructive/15

                                    text-destructive

                                    border-destructive/35

                                    hover:bg-destructive/25

                                  `

                              }

                            `}

                          >

                            {correct

                              ? "✓ "

                              : "✗ "}



                            {

                              players[

                                playerIndex

                              ].name

                            }



                            {correct

                              ? ` +${Math.round(

                                  value *

                                    0.25

                                )}`

                              : ` −${Math.round(

                                  value *

                                    0.25

                                )}`}

                          </button>

                        );

                      }

                    )}

                  </div>



                  <p className="text-xs text-muted-foreground/70 mt-3 text-center">

                    Grün = richtig · Rot = falsch

                  </p>

                </div>

              )}



              {/* RICHTIG / FALSCH */}

              <div className="grid grid-cols-2 gap-3">

                <Button

                  onClick={() =>

                    onResolve(

                      selectedPlayer,

                      false,

                      coGuessers,

                      correctCoGuessers

                    )

                  }

                  disabled={

                    players.length >

                      1 &&

                    selectedPlayer ===

                      null

                  }

                  size="lg"

                  className="

                    font-display

                    text-base md:text-lg

                    py-7

                    rounded-2xl

                    uppercase

                    tracking-wider

                    border

                    border-destructive/30

                    bg-destructive

                    text-destructive-foreground

                    hover:bg-destructive/90

                    hover:scale-[1.01]

                    transition-all

                    shadow-[0_0_20px_-10px_rgba(239,68,68,0.8)]

                  "

                >

                  <X className="mr-2 h-5 w-5" />

                  Falsch

                </Button>



                <Button

                  onClick={() =>

                    onResolve(

                      selectedPlayer,

                      true,

                      coGuessers,

                      correctCoGuessers

                    )

                  }

                  disabled={

                    players.length >

                      1 &&

                    selectedPlayer ===

                      null

                  }

                  size="lg"

                  className="

                    font-display

                    text-base md:text-lg

                    py-7

                    rounded-2xl

                    uppercase

                    tracking-wider

                    border

                    border-emerald-300/30

                    bg-emerald-500

                    text-emerald-950

                    hover:bg-emerald-400

                    hover:scale-[1.01]

                    transition-all

                    shadow-[0_0_20px_-10px_rgba(16,185,129,0.8)]

                  "

                >

                  <Check className="mr-2 h-5 w-5" />

                  Richtig

                </Button>

              </div>



              <button

                onClick={() =>

                  onResolve(

                    null,

                    false,

                    coGuessers,

                    correctCoGuessers

                  )

                }

                className="

                  w-full

                  text-xs

                  text-muted-foreground/70

                  hover:text-foreground

                  py-1

                  uppercase

                  tracking-[0.2em]

                  transition-colors

                "

              >

                Überspringen (keine Hauptpunkte)

              </button>

            </>

          )}

        </div>

      </DialogContent>

    </Dialog>

    {imageOverlay}

    </>

  );

}