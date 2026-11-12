import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StartScreen } from "@/components/jeopardy/StartScreen";
import { Board } from "@/components/jeopardy/Board";
import { QuestionModal } from "@/components/jeopardy/QuestionModal";
import {
  ScoreBoard,
  type ScorePopup,
} from "@/components/jeopardy/ScoreBoard";
import {
  GameStats,
  type PlayerStats,
} from "@/components/jeopardy/GameStats";
import { Editor } from "@/components/jeopardy/Editor";
import { Button } from "@/components/ui/button";
import {
  Music,
  VolumeX,
  Pencil,
  SlidersHorizontal,
  Crown,
  Dices,
  BarChart3,
} from "lucide-react";
import { POINT_VALUES, type QuestionResult } from "@/lib/jeopardy-data";
import { useCategories } from "@/lib/use-categories";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Familienquiz — Quizspiel" },
      {
        name: "description",
        content:
          "Spielt ein Quiz im Jeopardy-Stil mit 1–4 Spielern und bis zu 10 Kategorien.",
      },
      {
        property: "og:title",
        content: "Familienquiz — Quizspiel",
      },
      {
        property: "og:description",
        content:
          "Spielt ein Quiz im Jeopardy-Stil mit 1–4 Spielern und bis zu 10 Kategorien.",
      },
    ],
  }),
  component: Index,
});
interface Player {
  name: string;
  score: number;
}
interface Active {
  category: number;
  question: number;
}
interface LeadershipChange {
  playerName: string;
  score: number;
}
type Screen = "start" | "game" | "editor";
function makeAnswered(
  categoryCount: number,
  questionCount: number
) {
  return Array.from({ length: categoryCount }, () =>
    Array.from({ length: questionCount }, () => false)
  );
}
function makePlayerStats(count: number): PlayerStats[] {
  return Array.from({ length: count }, () => ({
    mainCorrect: 0,
    mainWrong: 0,
    pointsWon: 0,
    pointsLost: 0,
    highestScore: 0,
    biggestGain: 0,
    biggestLoss: 0,
    leadershipChanges: 0,
  }));
}
function getSoleLeaderIndex(
  players: Player[]
): number | null {
  if (players.length === 0) return null;
  const highestScore = Math.max(
    ...players.map((player) => player.score)
  );
  const leaders = players
    .map((player, index) => ({
      index,
      score: player.score,
    }))
    .filter(
      (player) => player.score === highestScore
    );
  if (leaders.length !== 1) {
    return null;
  }
  return leaders[0].index;
}
function Index() {
  const {
    categories: allCategories,
    save,
    meta,
    saveMeta,
    reset,
    quizSlot,
    loadQuiz,
  } = useCategories();
  // Normale Hintergrundmusik
  const audioRef =
    useRef<HTMLAudioElement | null>(null);
  // Einmaliger 10-Sekunden-Final-Sound
  const finalAudioRef =
    useRef<HTMLAudioElement | null>(null);
  // Spannungsmusik während der letzten Frage
  const tenseAudioRef =
    useRef<HTMLAudioElement | null>(null);
  const leaderRef =
    useRef<number | null>(null);
  const leadershipTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const randomTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const popupTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const popupIdRef = useRef(0);
  const [musicPlaying, setMusicPlaying] =
    useState(false);
  const [musicVolume, setMusicVolume] =
    useState(0.3);
  const [showVolume, setShowVolume] =
    useState(false);
  const [
    leadershipChange,
    setLeadershipChange,
  ] = useState<LeadershipChange | null>(null);
  const [
    isRandomizing,
    setIsRandomizing,
  ] = useState(false);
  const [
    highlightedQuestion,
    setHighlightedQuestion,
  ] = useState<Active | null>(null);
  const [gameStats, setGameStats] =
    useState<PlayerStats[]>([]);
  const [showStats, setShowStats] =
    useState(false);
  const [scorePopups, setScorePopups] =
    useState<ScorePopup[]>([]);
  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current =
        new Audio("/music/background.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = musicVolume;
    }
    if (musicPlaying) {
      audioRef.current.pause();
      if (tenseAudioRef.current) {
        tenseAudioRef.current.pause();
      }
      setMusicPlaying(false);
    } else {
      if (tenseAudioRef.current) {
        tenseAudioRef.current.volume =
          musicVolume;
        tenseAudioRef.current
          .play()
          .catch((error) => {
            console.error(
              "Tense-Musik konnte nicht abgespielt werden:",
              error
            );
          });
      } else {
        audioRef.current.volume =
          musicVolume;
        audioRef.current
          .play()
          .catch((error) => {
            console.error(
              "Hintergrundmusik konnte nicht abgespielt werden:",
              error
            );
          });
      }
      setMusicPlaying(true);
    }
  };
  const changeMusicVolume = (
    volume: number
  ) => {
    setMusicVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (tenseAudioRef.current) {
      tenseAudioRef.current.volume =
        volume;
    }
  };
  const stopFinalQuestionAudio = (
    resumeBackground = true
  ) => {
    if (finalAudioRef.current) {
      finalAudioRef.current.pause();
      finalAudioRef.current.currentTime = 0;
      finalAudioRef.current = null;
    }
    if (tenseAudioRef.current) {
      tenseAudioRef.current.pause();
      tenseAudioRef.current.currentTime = 0;
      tenseAudioRef.current = null;
    }
    if (
      resumeBackground &&
      musicPlaying &&
      audioRef.current
    ) {
      audioRef.current.volume =
        musicVolume;
      audioRef.current
        .play()
        .catch((error) => {
          console.error(
            "Hintergrundmusik konnte nicht fortgesetzt werden:",
            error
          );
        });
    }
  };
  const playFinalQuestionAudio = () => {
    // Falls aus irgendeinem Grund noch Boss-Audio läuft:
    stopFinalQuestionAudio(false);
    // Normale Musik bleibt an ihrer aktuellen Stelle stehen.
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // 10-Sekunden-Final-Sound
    const finalSound = new Audio(
      "/sounds/Sound_Effects/Final.mp3"
    );
    finalSound.volume = 0.4;
    finalAudioRef.current = finalSound;
    finalSound.onended = () => {
      if (
        finalAudioRef.current ===
        finalSound
      ) {
        finalAudioRef.current = null;
      }
    };
    finalSound
      .play()
      .catch((error) => {
        console.error(
          "Final-Sound konnte nicht abgespielt werden:",
          error
        );
        if (
          finalAudioRef.current ===
          finalSound
        ) {
          finalAudioRef.current = null;
        }
      });
    // Tense ersetzt nur dann die Hintergrundmusik,
    // wenn der Nutzer die Musik überhaupt eingeschaltet hat.
    if (musicPlaying) {
      const tenseMusic = new Audio(
        "/music/Tense.mp3"
      );
      tenseMusic.loop = true;
      tenseMusic.volume = musicVolume;
      tenseAudioRef.current =
        tenseMusic;
      tenseMusic
        .play()
        .catch((error) => {
          console.error(
            "Tense-Musik konnte nicht abgespielt werden:",
            error
          );
          if (
            tenseAudioRef.current ===
            tenseMusic
          ) {
            tenseAudioRef.current = null;
          }
        });
    }
  };
  const [screen, setScreen] =
    useState<Screen>("start");
  const [players, setPlayers] =
    useState<Player[]>([]);
  const [
    activeCategoryCount,
    setActiveCategoryCount,
  ] = useState(
    Math.min(6, allCategories.length)
  );
  const categories = useMemo(
    () =>
      allCategories.slice(
        0,
        activeCategoryCount
      ),
    [allCategories, activeCategoryCount]
  );
  const [answered, setAnswered] =
    useState<boolean[][]>(() =>
      makeAnswered(
        activeCategoryCount,
        POINT_VALUES.length
      )
    );
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [active, setActive] =
    useState<Active | null>(null);
  const allAnswered = useMemo(
    () =>
      answered.every((row) =>
        row.every(Boolean)
      ),
    [answered]
  );
  const MusicControls = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleMusic}
        className={`h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${
          musicPlaying
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"
        }`}
        title={
          musicPlaying
            ? "Musik ausschalten"
            : "Musik einschalten"
        }
      >
        {musicPlaying ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Music className="h-5 w-5" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          setShowVolume(
            (prev) => !prev
          )
        }
        className={`h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${
          showVolume
            ? "bg-primary text-primary-foreground"
            : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"
        }`}
        title="Lautstärke"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </Button>
      {showVolume && (
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) =>
              changeMusicVolume(
                Number(e.target.value)
              )
            }
            className="w-24 md:w-32 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground w-9 text-right">
            {Math.round(
              musicVolume * 100
            )}
            %
          </span>
        </div>
      )}
    </div>
  );
  if (screen === "editor") {
    return (
      <Editor
        initial={allCategories}
        initialMeta={meta}
        onSave={save}
        onSaveMeta={saveMeta}
        onReset={reset}
        onBack={() =>
          setScreen("start")
        }
      />
    );
  }
  if (screen === "start") {
    return (
      <div className="relative">
        <StartScreen
          title={meta.title}
          subtitle={meta.subtitle}
          maxCategories={
            allCategories.length
          }
          activeQuiz={quizSlot}
          onQuizChange={loadQuiz}
          onStart={(
            names,
            catCount
          ) => {
            stopFinalQuestionAudio(false);
            setPlayers(
              names.map((name) => ({
                name,
                score: 0,
              }))
            );
            setGameStats(
              makePlayerStats(
                names.length
              )
            );
            setActiveCategoryCount(
              catCount
            );
            setResults({});
            setAnswered(
              makeAnswered(
                catCount,
                POINT_VALUES.length
              )
            );
            leaderRef.current = null;
            setLeadershipChange(null);
            setHighlightedQuestion(null);
            setIsRandomizing(false);
            setShowStats(false);
            setScorePopups([]);
            if (
              leadershipTimerRef.current
            ) {
              clearTimeout(
                leadershipTimerRef.current
              );
              leadershipTimerRef.current =
                null;
            }
            if (
              randomTimerRef.current
            ) {
              clearTimeout(
                randomTimerRef.current
              );
              randomTimerRef.current =
                null;
            }
            if (
              popupTimerRef.current
            ) {
              clearTimeout(
                popupTimerRef.current
              );
              popupTimerRef.current =
                null;
            }
            setScreen("game");
          }}
        />
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          <MusicControls />
          <Button
            variant="outline"
            onClick={() =>
              setScreen("editor")
            }
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Fragen bearbeiten
          </Button>
        </div>
      </div>
    );
  }
  const activeResult = active ? results[`${active.category}:${active.question}`] : undefined;
  const activeQuestion =
    activeResult?.question ?? (active !== null
      ? categories[
          active.category
        ].questions[
          active.question
        ]
      : null);
  const activeValue =
    active !== null
      ? categories[
          active.category
        ].questions[
          active.question
        ].value ??
        POINT_VALUES[
          active.question
        ]
      : 0;
  const activeCategory =
    active !== null
      ? categories[
          active.category
        ].name
      : "";
  const openQuestion = (
    questionToOpen: Active
  ) => {
    const category =
      categories[
        questionToOpen.category
      ];
    const lastQuestionIndex =
      category.questions.length - 1;
    const isFinalQuestion =
      questionToOpen.question ===
      lastQuestionIndex;
    if (isFinalQuestion && !answered[questionToOpen.category]?.[questionToOpen.question]) {
      playFinalQuestionAudio();
    } else {
      stopFinalQuestionAudio();
    }
    setActive(questionToOpen);
  };
  const closeQuestion = () => {
    stopFinalQuestionAudio();
    setActive(null);
  };
  const selectRandomQuestion = () => {
    if (isRandomizing) return;
    const availableQuestions: Active[] =
      [];
    answered.forEach(
      (
        row,
        categoryIndex
      ) => {
        row.forEach(
          (
            isAnswered,
            questionIndex
          ) => {
            if (!isAnswered) {
              availableQuestions.push({
                category:
                  categoryIndex,
                question:
                  questionIndex,
              });
            }
          }
        );
      }
    );
    if (
      availableQuestions.length === 0
    ) {
      return;
    }
    setIsRandomizing(true);
    const finalQuestion =
      availableQuestions[
        Math.floor(
          Math.random() *
            availableQuestions.length
        )
      ];
    const delays = [
      70,
      80,
      90,
      100,
      110,
      120,
      140,
      160,
      190,
      230,
      280,
    ];
    let step = 0;
    let previousQuestion:
      | Active
      | null = null;
    const runRoulette = () => {
      const isFinalStep =
        step >= delays.length;
      if (isFinalStep) {
        setHighlightedQuestion(
          finalQuestion
        );
        randomTimerRef.current =
          setTimeout(() => {
            setIsRandomizing(
              false
            );
            setHighlightedQuestion(
              null
            );
            openQuestion(
              finalQuestion
            );
            randomTimerRef.current =
              null;
          }, 600);
        return;
      }
      let randomQuestion =
        availableQuestions[
          Math.floor(
            Math.random() *
              availableQuestions.length
          )
        ];
      if (
        availableQuestions.length >
          1 &&
        previousQuestion
      ) {
        while (
          randomQuestion.category ===
            previousQuestion.category &&
          randomQuestion.question ===
            previousQuestion.question
        ) {
          randomQuestion =
            availableQuestions[
              Math.floor(
                Math.random() *
                  availableQuestions.length
              )
            ];
        }
      }
      previousQuestion =
        randomQuestion;
      setHighlightedQuestion(
        randomQuestion
      );
      randomTimerRef.current =
        setTimeout(() => {
          step++;
          runRoulette();
        }, delays[step]);
    };
    runRoulette();
  };
  const handleResolve = (
    playerIndex: number | null,
    correct: boolean,
    resolvedValue: number = activeValue,
    selectedChoice: number | null = null
  ) => {
    if (!active || answered[active.category]?.[active.question]) return;
    // Bossmusik beenden und normale Hintergrundmusik fortsetzen.
    stopFinalQuestionAudio();
    const wrongSounds = [
      {
        path: "/sounds/Wrong/Dummkopf.WAV",
        volume: 1.0,
      },
      {
        path: "/sounds/Wrong/HAHA.WAV",
        volume: 0.5,
      },
      {
        path: "/sounds/Wrong/Homer Simpson Langweilig.mp3",
        volume: 0.4,
      },
      {
        path: "/sounds/Wrong/Homer Simpson Nein!.mp3",
        volume: 1.0,
      },
      {
        path: "/sounds/Wrong/Nein, Nein, Nein, Nein! (Hitler Meme) - Sound Effect for editing.mp3",
        volume: 0.8,
      },
      {
        path: "/sounds/Wrong/zonk.mp3",
        volume: 0.3,
      },
      {
        path: "/sounds/Wrong/Mario Fail.mp3",
        volume: 0.6,
      },
        {
        path: "/sounds/Wrong/son looser.mp3",
        volume: 0.6,
      },
       {
        path: "/sounds/Wrong/Scheisse.mp3",
        volume: 0.6,
      },
       {
        path: "/sounds/Wrong/NeinDochOh.mp3",
        volume: 0.6,
      },
    ];
    const correctSounds = [
      {
        path: "/sounds/Correct/Ja sound effect Hitler.mp3",
        volume: 0.9,
      },
      {
        path: "/sounds/Correct/Who Wants to Be a Millionaire - £100 – £500 Correct Answer [SOUND EFFECT].mp3",
        volume: 0.7,
      },
      {
        path: "/sounds/Correct/Zelda Receive Item - Sound Effect for editing.mp3",
        volume: 0.4,
      },
      {
        path: "/sounds/Correct/Zeldariddle.mp3",
        volume: 0.2,
      },
      {
        path: "/sounds/Correct/Yeah Baby Yea.WAV",
        volume: 1.0,
      },
      {
        path: "/sounds/Correct/Al.WAV",
        volume: 1.0,
      },
    ];
    const soundData = correct
      ? correctSounds[
          Math.floor(
            Math.random() *
              correctSounds.length
          )
        ]
      : wrongSounds[
          Math.floor(
            Math.random() *
              wrongSounds.length
          )
        ];
    const sound =
      new Audio(
        soundData.path
      );
    sound.volume =
      soundData.volume;
    sound
      .play()
      .catch((error) => {
        console.error(
          "Sound konnte nicht abgespielt werden:",
          soundData.path,
          error
        );
      });
    setPlayers((prev) => {
      const previousLeader =
        leaderRef.current;
      const scoreChanges =
        prev.map(
          (_, index) => {
            let scoreChange = 0;
            if (
              index ===
              playerIndex
            ) {
              scoreChange += correct
                ? resolvedValue
                : -Math.round(
                    resolvedValue / 2
                  );
            }
            return scoreChange;
          }
        );
      const nextPlayers =
        prev.map(
          (
            player,
            index
          ) => ({
            ...player,
            score:
              player.score +
              scoreChanges[
                index
              ],
          })
        );
      const newPopups: ScorePopup[] =
        scoreChanges
          .map(
            (
              amount,
              index
            ) => ({
              id:
                ++popupIdRef.current,
              playerIndex:
                index,
              amount,
            })
          )
          .filter(
            (popup) =>
              popup.amount !== 0
          );
      setScorePopups(
        newPopups
      );
      if (
        popupTimerRef.current
      ) {
        clearTimeout(
          popupTimerRef.current
        );
      }
      popupTimerRef.current =
        setTimeout(() => {
          setScorePopups([]);
          popupTimerRef.current =
            null;
        }, 1600);
      const newLeader =
        getSoleLeaderIndex(
          nextPlayers
        );
      setGameStats(
        (previousStats) =>
          previousStats.map(
            (
              stat,
              index
            ) => {
              const scoreChange =
                scoreChanges[
                  index
                ];
              const isMainPlayer =
                index ===
                playerIndex;
              const becameLeader =
                newLeader ===
                  index &&
                newLeader !==
                  previousLeader;
              return {
                ...stat,
                mainCorrect:
                  stat.mainCorrect +
                  (isMainPlayer &&
                  correct
                    ? 1
                    : 0),
                mainWrong:
                  stat.mainWrong +
                  (isMainPlayer &&
                  !correct
                    ? 1
                    : 0),
                pointsWon:
                  stat.pointsWon +
                  (scoreChange > 0
                    ? scoreChange
                    : 0),
                pointsLost:
                  stat.pointsLost +
                  (scoreChange < 0
                    ? Math.abs(
                        scoreChange
                      )
                    : 0),
                highestScore:
                  Math.max(
                    stat.highestScore,
                    nextPlayers[
                      index
                    ].score
                  ),
                biggestGain:
                  Math.max(
                    stat.biggestGain,
                    scoreChange > 0
                      ? scoreChange
                      : 0
                  ),
                biggestLoss:
                  Math.max(
                    stat.biggestLoss,
                    scoreChange < 0
                      ? Math.abs(
                          scoreChange
                        )
                      : 0
                  ),
                leadershipChanges:
                  stat.leadershipChanges +
                  (becameLeader
                    ? 1
                    : 0),
              };
            }
          )
      );
      if (
        newLeader !== null &&
        newLeader !==
          previousLeader
      ) {
        const leader =
          nextPlayers[
            newLeader
          ];
        setLeadershipChange({
          playerName:
            leader.name,
          score:
            leader.score,
        });
        if (
          leadershipTimerRef.current
        ) {
          clearTimeout(
            leadershipTimerRef.current
          );
        }
        leadershipTimerRef.current =
          setTimeout(() => {
            setLeadershipChange(
              null
            );
            leadershipTimerRef.current =
              null;
          }, 2500);
      }
      leaderRef.current =
        newLeader;
      return nextPlayers;
    });
    setResults(prev => ({ ...prev, [`${active.category}:${active.question}`]: {
      question: structuredClone(activeQuestion!), category: activeCategory,
      value: resolvedValue, playerIndex, correct, selectedChoice,
    } }));
    setAnswered((prev) => {
      const next =
        prev.map((row) => [
          ...row,
        ]);
      next[
        active.category
      ][
        active.question
      ] = true;
      return next;
    });
    setActive(null);
  };
  const handleManualScoreChange = (
  playerIndex: number,
  newScore: number
) => {
  setPlayers((prev) => {
    const nextPlayers =
      prev.map(
        (
          player,
          index
        ) =>
          index ===
          playerIndex
            ? {
                ...player,
                score:
                  newScore,
              }
            : player
      );
    leaderRef.current =
      getSoleLeaderIndex(
        nextPlayers
      );
    return nextPlayers;
  });
};
  const winner =
    allAnswered
      ? [...players].sort(
          (a, b) =>
            b.score -
            a.score
        )[0]
      : null;
  return (
    <div className={`min-h-screen p-3 md:p-6 mx-auto ${categories.length >= 8 ? "max-w-[1920px]" : "max-w-7xl"}`}>
      {showStats && (
        <GameStats
          players={players}
          stats={gameStats}
          onClose={() =>
            setShowStats(false)
          }
          onNewGame={() => {
            stopFinalQuestionAudio(false);
            setShowStats(false);
            setScreen("start");
          }}
        />
      )}
      {leadershipChange && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-300" />
          <div className="relative glass-strong border border-amber-400/40 rounded-3xl px-8 py-7 md:px-14 md:py-10 text-center shadow-2xl animate-in zoom-in-75 fade-in duration-300">
            <Crown className="h-14 w-14 md:h-20 md:w-20 mx-auto mb-3 text-amber-400 drop-shadow-lg" />
            <p className="font-display text-lg md:text-2xl uppercase tracking-[0.2em] text-amber-400 mb-2">
              Neue Führung!
            </p>
            <p className="font-display text-3xl md:text-5xl uppercase text-foreground">
              {
                leadershipChange.playerName
              }
            </p>
            <p className="mt-3 text-lg md:text-2xl text-muted-foreground">
              übernimmt mit{" "}
              <span className="text-foreground font-bold">
                {
                  leadershipChange.score
                }
              </span>{" "}
              Punkten!
            </p>
          </div>
        </div>
      )}
      <div className="fixed top-4 right-4 z-50">
        <MusicControls />
      </div>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6 pr-28">
        <h1
          className="font-display text-3xl md:text-5xl text-foreground tracking-tight uppercase"
          style={{
            textShadow:
              "0 0 30px oklch(0.55 0.24 278 / 0.6)",
          }}
        >
          {meta.title}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={
              selectRandomQuestion
            }
            disabled={
              allAnswered ||
              isRandomizing
            }
            className={`glass text-foreground hover:bg-primary hover:text-primary-foreground border-white/15 rounded-xl ${
              isRandomizing
                ? "animate-pulse"
                : ""
            }`}
          >
            <Dices
              className={`mr-2 h-4 w-4 ${
                isRandomizing
                  ? "animate-spin"
                  : ""
              }`}
            />
            {isRandomizing
              ? "Würfelt..."
              : "Zufallsfrage"}
          </Button>
          <Button
            onClick={() => {
              stopFinalQuestionAudio(false);
              setScreen("start");
            }}
            disabled={
              isRandomizing
            }
            className="glass text-foreground hover:bg-white/15 border-white/15 rounded-xl"
          >
            Neues Spiel
          </Button>
        </div>
      </header>
      <div className="mb-4 md:mb-6">
        <ScoreBoard
  players={players}
  scorePopups={scorePopups}
  onScoreChange={handleManualScoreChange}
/>
      </div>
      {winner && (
        <div className="mb-4 md:mb-6 glass-strong rounded-3xl p-5 md:p-6 text-center glow-primary animate-in fade-in zoom-in">
          <p className="font-display text-2xl md:text-4xl uppercase text-foreground tracking-wide mb-4">
            🏆 {winner.name} gewinnt
            mit {winner.score}!
          </p>
          <Button
            onClick={() =>
              setShowStats(true)
            }
            size="lg"
            className="rounded-2xl font-display uppercase tracking-wider"
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Auswertung anzeigen
          </Button>
        </div>
      )}
      <Board
        categories={categories}
        answered={answered}
        results={results}
        players={players}
        highlightedQuestion={
          highlightedQuestion
        }
        isRandomizing={
          isRandomizing
        }
        onSelect={(
          category,
          question
        ) =>
          openQuestion({
            category,
            question,
          })
        }
      />
      <QuestionModal
        open={active !== null}
        question={
          activeQuestion
        }
        value={activeResult?.value ?? activeValue}
        review={activeResult}
        category={activeResult?.category ?? activeCategory}
        players={players}
        onResolve={
          handleResolve
        }
        onClose={
          closeQuestion
        }
      />
    </div>
  );
}