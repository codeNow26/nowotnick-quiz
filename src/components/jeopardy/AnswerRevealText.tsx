import { useEffect, useState } from "react";

interface AnswerRevealTextProps {
  question: string;
  answer: string;
  revealed: boolean;
  highStakes: boolean;
}

/**
 * Keeps question and answer in the same grid cell during the reveal. The
 * tallest text determines the stage height, so neither the dialog nor the
 * scoring controls jump when the answer replaces a long question.
 *
 * An absolutely positioned radial bloom is the only decoration: no scanning
 * stripes, viewport-wide layers or layout-changing 3D transforms.
 */
export function AnswerRevealText({
  question,
  answer,
  revealed,
  highStakes,
}: AnswerRevealTextProps) {
  const [bloomFinished, setBloomFinished] = useState(false);

  useEffect(() => {
    if (!revealed) setBloomFinished(false);
  }, [revealed]);

  return (
    <div
      className="quiz-grand-answer-stage relative isolate grid w-full place-items-center"
      data-revealed={revealed || undefined}
      data-high-stakes={highStakes || undefined}
    >
      {revealed && !bloomFinished && (
        <span
          className="quiz-grand-answer-bloom"
          aria-hidden="true"
          onAnimationEnd={() => setBloomFinished(true)}
        />
      )}
      <p
        className={`quiz-grand-answer-question font-sans text-2xl font-bold leading-snug whitespace-pre-line break-words md:text-4xl ${!revealed ? "quiz-question-ink" : ""}`}
        aria-hidden={revealed}
        style={{ textShadow: "0 3px 30px rgba(0,0,0,0.35)" }}
      >
        {question}
      </p>
      {revealed && (
        <p
          role="status"
          aria-live="polite"
          className="quiz-grand-answer-result font-sans text-2xl font-bold leading-snug whitespace-pre-line break-words md:text-4xl"
        >
          {answer}
        </p>
      )}
    </div>
  );
}
