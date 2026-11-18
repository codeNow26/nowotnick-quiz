import { AwardCeremony } from "./AwardCeremony";
import { BonusHostRound } from "./BonusHostRound";
import { prepareBonusSession, readBonusHost, type BonusSession } from "@/lib/bonus-pass-api";
import { readBonusSettings, bonusMilestone, bonusQuestionError } from "@/lib/bonus-rounds";
import { ensureCategoryCount, ensureQuestionRows, MAX_CATEGORIES } from "@/lib/quiz-repository";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link } from "@tanstack/react-router";
import { CreateQuiz } from "./CreateQuiz";
import { StartScreen } from "@/components/jeopardy/StartScreen";
import { Board } from "@/components/jeopardy/Board";
import { useGameStartAnimation } from "./GameStartSequence";
import { readPlayerPreferences, normalizeColors } from "@/lib/player-preferences";
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
  Dices,
  BarChart3,
} from "lucide-react";
import { nextRound, type FormatRound, type RoundAction, type FormatAttempt } from "@/lib/question-formats";
import { DEFAULT_QUESTION_ROWS, defaultQuestionValue, type QuestionResult } from "@/lib/jeopardy-data";
import { useCategories } from "@/lib/use-categories";
interface Player {
  color: string;
  name: string;
  score: number;
}
interface Active {
  category: number;
  question: number;
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
export function QuizApp({ customId, editInitially = false }: { customId?: string; editInitially?: boolean }) {
  const [gameEntering, setGameEntering] = useState(false);
  const gameStageRef = useGameStartAnimation(gameEntering, setGameEntering);
  const ambientEventRef = useRef<HTMLDivElement>(null);

  const pulseBackground = (color: string, x = 50, y = 50) => {
    const glow = ambientEventRef.current;
    if (!glow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    glow.style.setProperty("--quiz-pulse-x", `${x}%`);
    glow.style.setProperty("--quiz-pulse-y", `${y}%`);
    glow.style.setProperty("--quiz-pulse-color", color);
    gsap.killTweensOf(glow);
    gsap.timeline()
      .fromTo(glow, { opacity: 0 }, { opacity: 0.7, duration: 0.22, ease: "power2.out" })
      .to(glow, { opacity: 0, duration: 0.75, ease: "power2.inOut" });
  };

  const {
    categories: allCategories,
    editorTarget, editorSource, applySaved,
    meta,
    loading,
    loadError,
    quizSlot,
    loadQuiz,
  } = useCategories(customId);
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
  const randomTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const popupTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const sealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupIdRef = useRef(0);
  const [musicPlaying, setMusicPlaying] =
    useState(false);
  const [musicVolume, setMusicVolume] =
    useState(0.3);
  const [showVolume, setShowVolume] =
    useState(false);
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
  const [sealingQuestion, setSealingQuestion] = useState<Active | null>(null);
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
    useState<Screen>(editInitially ? "editor" : "start");
  const [testSession, setTestSession] = useState(false);
  const [lastEditorCategory, setLastEditorCategory] = useState(0);
  const [players, setPlayers] =
    useState<Player[]>([]);
  const [
    activeCategoryCount,
    setActiveCategoryCount,
  ] = useState(
    6
  );
  const questionRows: 5 | 6 = editorSource?.data.questionRows === 6 ? 6 : 5;
  const bonusConfig = readBonusSettings(editorSource?.data.bonus);
  const categories = useMemo(
    () => ensureQuestionRows(ensureCategoryCount(allCategories,activeCategoryCount),questionRows).slice(0, activeCategoryCount),
    [allCategories, activeCategoryCount, questionRows]
  );
  const [answered, setAnswered] =
    useState<boolean[][]>(() =>
      makeAnswered(
        activeCategoryCount,
        DEFAULT_QUESTION_ROWS
      )
    );
  const [formatRounds,setFormatRounds]=useState<Record<string,FormatRound>>({});
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [finishedBonuses, setFinishedBonuses] = useState<number[]>([]);
  const [preparedBonus, setPreparedBonus] = useState<{session: BonusSession; roster: string; quizId: string} | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("quiz-bonus-phone");
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved?.session?.id && saved?.session?.hostToken && saved?.session?.code &&
        typeof saved.roster === "string" && typeof saved.quizId === "string" ? saved : null;
    } catch { return null; }
  });
  const [phoneOnline, setPhoneOnline] = useState(false);
  useEffect(() => {
    try {
      if (preparedBonus) window.sessionStorage.setItem("quiz-bonus-phone", JSON.stringify(preparedBonus));
      else window.sessionStorage.removeItem("quiz-bonus-phone");
    } catch { /* Private browsing may restrict session storage. */ }
  }, [preparedBonus]);
  useEffect(() => {
    if (!preparedBonus) { setPhoneOnline(false); return; }
    let active = true;
    const poll = async () => {
      try {
        const result = await readBonusHost(preparedBonus.session);
        if (active) setPhoneOnline(result.phoneOnline === true);
      } catch (e) {
        if (!active) return;
        setPhoneOnline(false);
        // A truly expired pairing can be recreated before the quiz starts.
        if (e instanceof Error && /abgelaufen|nicht gefunden/i.test(e.message)) {
          setPreparedBonus(existing => existing?.session.id === preparedBonus.session.id ? null : existing);
        }
      }
    };
    void poll();
    const timer = window.setInterval(poll, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [preparedBonus]);
  const [activeBonus, setActiveBonus] = useState<number | null>(null);
  const [active, setActive] =
    useState<Active | null>(null);
  const activeKey = active ? `${active.category}:${active.question}` : null;
  const dispatchRound = useCallback((action: RoundAction) => {
    if (activeKey === null) return;
    setFormatRounds(previous => {
      const before = previous[activeKey] ?? {};
      const after = nextRound(before, action);
      return before === after ? previous : { ...previous, [activeKey]: after };
    });
  }, [activeKey]);
  const answeredCount = answered.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const totalQuestions = categories.length * questionRows;
  const nextBonus = bonusConfig.enabled ? bonusConfig.rounds.findIndex((round, index) =>
    !finishedBonuses.includes(index) && !bonusQuestionError(round) &&
    answeredCount >= bonusMilestone(index, totalQuestions, bonusConfig)) : -1;
  const allAnswered = useMemo(
    () =>
      answered.every((row) =>
        row.every(Boolean)
      ),
    [answered]
  );
  const revealOrigin = useRef({ x: 0, y: 8 });
  const ceremonyPlayed = useRef(false);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  useEffect(() => {
    if (screen !== "game" || !allAnswered || active || showStats || ceremonyPlayed.current) return;
    // Let the final score settle before entering the podium.
    const timer = window.setTimeout(() => {
      ceremonyPlayed.current = true;
      setCeremonyOpen(true);
    }, 1150);
    return () => window.clearTimeout(timer);
  }, [screen, allAnswered, active, showStats]);
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
  useEffect(() => () => {
    for (const ref of [audioRef, finalAudioRef, tenseAudioRef]) {
      ref.current?.pause();
      if (ref.current) ref.current.src = '';
    }
    for (const ref of [randomTimerRef, popupTimerRef, sealTimerRef]) {
      if (ref.current) clearTimeout(ref.current);
    }
  }, []);
  const launchGame = (
    names: string[],
    catCount: number,
    colors: string[],
    rows: 5 | 6 = questionRows,
    fromEditor = false,
  ) => {
    setTestSession(fromEditor);
    // Only keep a prepared phone if its quiz and player order still match.
    setPreparedBonus(existing => existing &&
      existing.quizId === editorSource?.id &&
      existing.roster === JSON.stringify(names.map((name, i) => ({name, color: colors[i]})))
        ? existing : null);
            stopFinalQuestionAudio(false);
            setPlayers(
              names.map((name, index) => ({
                name,
                color: colors[index],
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
            setFormatRounds({});
            setFinishedBonuses([]);
            setActiveBonus(null);
            setAnswered(
              makeAnswered(
                catCount,
                rows
              )
            );
            leaderRef.current = null;
            ceremonyPlayed.current = false;
            setCeremonyOpen(false);
            setHighlightedQuestion(null);
            setIsRandomizing(false);
            setShowStats(false);
            setScorePopups([]);
            setSealingQuestion(null);
            if (sealTimerRef.current) {
              clearTimeout(sealTimerRef.current);
              sealTimerRef.current = null;
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
            setGameEntering(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
            setScreen("game");
  };
  if (loading || loadError) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="font-display text-2xl">{loading ? 'Quiz wird geladen …' : 'Quiz konnte nicht geladen werden'}</h1>
    {loadError && <><p role="alert" className="max-w-xl text-muted-foreground">{loadError}</p><Button onClick={() => void loadQuiz(quizSlot)}>Erneut versuchen</Button>
    {!customId && <div className="flex flex-wrap gap-2">{([1,2,3,4] as const).map(slot => <Button key={slot} variant="outline" onClick={() => void loadQuiz(slot)}>Quiz {slot}</Button>)}</div>}
    <Link to="/">Zur Startseite</Link></>}
  </main>;
  if (screen === "editor") {
    return (
      <Editor
        key={editorSource!.id}
        source={editorSource!}
        target={editorTarget}
        categoryCount={activeCategoryCount}
        onCategoryCountChange={setActiveCategoryCount}
        initialCategory={Math.min(lastEditorCategory, Math.max(0, activeCategoryCount-1))}
        onSaved={applySaved}
        onBack={() =>
          setScreen("start")
        }
        onTest={(rows, categoryIndex) => {
          setLastEditorCategory(categoryIndex);
          const prefs = readPlayerPreferences();
          const count = Math.max(1, Math.min(6, prefs.count));
          const names = prefs.names.slice(0,count).map((name,index) =>
            name.trim() || `Spieler ${index+1}`
          );
          const colors = normalizeColors(prefs.colors).slice(0,count);
          launchGame(names, activeCategoryCount, colors, rows, true);
        }}
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
            customId ? MAX_CATEGORIES : allCategories.length
          }
          selectedCategoryCount={activeCategoryCount}
          onCategoryCountChange={setActiveCategoryCount}
          key={customId ?? quizSlot}
          activeQuiz={customId ? undefined : quizSlot}
          footer={<div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">{!customId && <CreateQuiz />}{customId && <Link to="/" className="rounded-xl border border-white/15 px-4 py-2">Zur Startseite</Link>}<Link to="/verwaltung" className="rounded-xl border border-white/15 px-4 py-2">Quiz-Verwaltung</Link></div>}
          onQuizChange={loadQuiz}
          preparedBonus={preparedBonus?.quizId === editorSource?.id ? preparedBonus : null}
          phoneOnline={phoneOnline}
          onPrepareBonus={bonusConfig.enabled && bonusConfig.rounds.length > 0 && editorSource
            ? async phonePlayers => {
                const session = await prepareBonusSession(editorSource.id, phonePlayers);
                setPreparedBonus({session, roster: JSON.stringify(phonePlayers), quizId: editorSource.id});
              }
            : undefined}
          onStart={(names, count, colors) => launchGame(names, count, colors)}
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
        defaultQuestionValue(
          active.question
        )
      : 0;
  const activeCategory =
    active !== null
      ? categories[
          active.category
        ].name
      : "";
  const highStakes = active !== null && !activeResult &&
    activeValue >= Math.max(1, ...categories[active.category].questions.slice(0,questionRows).map(
      (q, index) => q.value ?? defaultQuestionValue(index)
    ));
  const openQuestion = (
    questionToOpen: Active
  ) => {
    const category =
      categories[
        questionToOpen.category
      ];
    const lastQuestionIndex = questionRows - 1;
    const isFinalQuestion =
      questionToOpen.question ===
      lastQuestionIndex;
    if (isFinalQuestion && !answered[questionToOpen.category]?.[questionToOpen.question]) {
      playFinalQuestionAudio();
    } else {
      stopFinalQuestionAudio();
    }
    const cell = document.querySelector<HTMLButtonElement>(`[data-quiz-cell="${questionToOpen.category}-${questionToOpen.question}"]`);
    const rect = cell?.getBoundingClientRect();
    if (rect) {
      pulseBackground("rgba(143,111,245,.35)",
        Math.min(100, Math.max(0, 100 * (rect.left + rect.width / 2) / innerWidth)),
        Math.min(100, Math.max(0, 100 * (rect.top + rect.height / 2) / innerHeight))
      );
      revealOrigin.current = {
        x: Math.min(innerWidth, Math.max(0, rect.left + rect.width / 2)) - innerWidth / 2,
        y: Math.min(innerHeight, Math.max(0, rect.top + rect.height / 2)) - innerHeight / 2,
      };
    } else {
      revealOrigin.current = { x: 0, y: 8 };
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
    selectedChoice: number | null = null,
    attempt?: FormatAttempt
  ) => {
    if (!active || answered[active.category]?.[active.question]) return;
    if (playerIndex !== null && activeQuestion?.type === "estimate" && playerIndex !== (players.length === 1 ? 0 : formatRounds[`${active.category}:${active.question}`]?.owner)) return;
    // Bossmusik beenden und normale Hintergrundmusik fortsetzen.
    stopFinalQuestionAudio();
    if (playerIndex !== null) {
      pulseBackground(correct ? (players[playerIndex]?.color || "rgba(134,109,241,.35)") : "rgba(235,111,144,.26)", 50, 26);
    }
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
    const previousLeader =
      leaderRef.current;
    const scoreChanges =
      players.map(
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
      players.map(
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
    leaderRef.current =
      newLeader;
    setPlayers(nextPlayers);
    setResults(prev => ({ ...prev, [`${active.category}:${active.question}`]: {
      question: structuredClone(activeQuestion!), category: activeCategory,
      value: resolvedValue, playerIndex, correct, selectedChoice, attempt,
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
    setSealingQuestion(active);
    if (sealTimerRef.current) clearTimeout(sealTimerRef.current);
    sealTimerRef.current = setTimeout(() => {
      setSealingQuestion(null);
      sealTimerRef.current = null;
    }, 850);
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
    <div ref={gameStageRef} className={`relative isolate min-h-screen p-3 md:p-6 mx-auto ${gameEntering ? "quiz-game-launching" : ""} ${categories.length >= 8 ? "max-w-[1920px]" : "max-w-7xl"}`}>
      <div ref={ambientEventRef} aria-hidden="true" className="quiz-ambient-event" />
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
      {ceremonyOpen && <AwardCeremony players={players} onDismiss={() => setCeremonyOpen(false)} />}
      <div className="fixed top-4 right-4 z-50">
        <MusicControls />
      </div>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6 pr-28">
        <h1
          className="quiz-title font-display text-3xl md:text-5xl text-foreground tracking-tight uppercase"
          style={{
            textShadow:
              "0 0 30px oklch(0.55 0.24 278 / 0.6)",
          }}
        >
          {meta.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {testSession && (
            <Button
              type="button"
              onClick={() => {
                stopFinalQuestionAudio(false);
                setActive(null);
                setShowStats(false);
                setCeremonyOpen(false);
                setTestSession(false);
                setScreen("editor");
              }}
              className="rounded-xl border border-primary/35 bg-primary/[0.10] text-primary hover:bg-primary/[0.18] hover:text-foreground transition-colors duration-300"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Zurück zum Editor
            </Button>
          )}
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
            {players.filter(p => p.score === winner.score).length === 1
              ? `🏆 ${winner.name} gewinnt mit ${winner.score} Punkten!`
              : `Gemeinsamer Sieg mit ${winner.score} Punkten!`}
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

      {bonusConfig.enabled && bonusConfig.rounds.length > 0 && nextBonus >= 0 && activeBonus === null && active === null && !gameEntering && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#b89b66]/35 bg-[#b89b66]/[0.07] p-3 sm:p-4">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-xl">✨</span>
            <div>
              <p className="font-semibold text-[#e9d6a8]">Eine gemeinsame Schätzrunde ist bereit!</p>
              <p className="text-xs text-muted-foreground">Runde {nextBonus + 1} von {bonusConfig.rounds.length} · Alle dürfen mitmachen.</p>
            </div>
          </div>
          <Button type="button" className="rounded-xl" onClick={() => setActiveBonus(nextBonus)}>Alle schätzen!</Button>
        </div>
      )}
      {testSession && bonusConfig.enabled && activeBonus === null && nextBonus < 0 && (
        <div className="mb-3 flex justify-end">
          <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => {
            const index = bonusConfig.rounds.findIndex((round, i) => !finishedBonuses.includes(i) && !bonusQuestionError(round));
            if (index >= 0) setActiveBonus(index);
          }}>Schätzrunde testweise starten</Button>
        </div>
      )}
      <Board
        questionRows={questionRows}
        launching={gameEntering}
        categories={categories}
        answered={answered}
        selected={active}
        sealing={sealingQuestion}
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
      {activeBonus !== null && bonusConfig.rounds[activeBonus] && (
        <BonusHostRound
          key={activeBonus}
          quizId={editorSource!.id}
          roundNumber={activeBonus + 1}
          totalRounds={bonusConfig.rounds.length}
          question={bonusConfig.rounds[activeBonus]}
          players={players}
          preparedSession={preparedBonus?.quizId === editorSource?.id &&
            preparedBonus.roster === JSON.stringify(players.map(p => ({name: p.name, color: p.color})))
              ? preparedBonus.session : null}
          onClose={() => setActiveBonus(null)}
          onAward={(winnerIndices, points) => {
            setPlayers(previous => {
              const updated = previous.map((p, i) => winnerIndices.includes(i) ? { ...p, score: p.score + points } : p);
              leaderRef.current = getSoleLeaderIndex(updated);
              return updated;
            });
            setGameStats(previous => previous.map((stat, i) => winnerIndices.includes(i)
              ? { ...stat, pointsWon: stat.pointsWon + points, biggestGain: Math.max(stat.biggestGain, points), highestScore: Math.max(stat.highestScore, (players[i]?.score ?? 0) + points) }
              : stat));
            setScorePopups(winnerIndices.map(i => ({ id: ++popupIdRef.current, playerIndex: i, amount: points })));
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
            popupTimerRef.current = setTimeout(() => { setScorePopups([]); popupTimerRef.current = null; }, 1600);
            setFinishedBonuses(previous => activeBonus !== null && !previous.includes(activeBonus) ? [...previous, activeBonus] : previous);
            setActiveBonus(null);
          }}
        />
      )}
      <QuestionModal
        round={activeKey ? formatRounds[activeKey] : undefined}
        dispatchRound={dispatchRound}
        origin={revealOrigin.current}
        open={active !== null}
        highStakes={highStakes}
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