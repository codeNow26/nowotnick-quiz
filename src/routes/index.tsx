import { createFileRoute } from "@tanstack/react-router";
import { QuizApp } from "@/components/jeopardy/QuizApp";
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
  component: QuizApp,
});
