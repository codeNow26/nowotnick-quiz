import { createFileRoute } from '@tanstack/react-router';
import { QuizManager } from '@/components/jeopardy/QuizManager';
export const Route = createFileRoute('/verwaltung')({ component: QuizManager });
