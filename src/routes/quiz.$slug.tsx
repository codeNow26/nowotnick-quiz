import { createFileRoute, Link } from '@tanstack/react-router';
import { QuizApp } from '@/components/jeopardy/QuizApp';
import { findQuiz } from '@/lib/quiz-repository';
export const Route = createFileRoute('/quiz/$slug')({
  validateSearch: (search: Record<string, unknown>) => ({ edit: search.edit === true || search.edit === 'true' }),
  loader: ({ params }) => findQuiz(params.slug),
  pendingComponent: () => <p role="status" className="p-12 text-center">Quiz wird geladen …</p>,
  errorComponent: ({ error }) => <main className="mx-auto max-w-xl p-8 text-center space-y-6"><h1 className="font-display text-2xl">Quiz nicht verfügbar</h1><p role="alert">{error instanceof Error ? error.message : 'Das Quiz konnte nicht geladen werden.'}</p><div className="flex justify-center gap-4"><button onClick={() => window.location.reload()} className="text-primary">Erneut versuchen</button><Link to="/">Zur Startseite</Link></div></main>,
  component: CustomQuizPage,
});
function CustomQuizPage() {
  const quiz = Route.useLoaderData();
  const { edit } = Route.useSearch();
  return <QuizApp key={`${quiz.id}:${edit}`} customId={quiz.id} editInitially={edit} />;
}
