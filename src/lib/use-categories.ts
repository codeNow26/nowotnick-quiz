import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORIES, POINT_VALUES, type Category } from './jeopardy-data';
import { loadQuizData, saveQuizData, type LoadedQuiz, type QuizMeta, type QuizTarget, type QuizSlot } from './quiz-repository';
export { QUIZ_IDS, type QuizSlot } from './quiz-repository';
export const DEFAULT_TITLE = 'Nowotnick Quiz';
export const DEFAULT_SUBTITLE = 'Quiz halt.';

export function useCategories(customId?: string) {
  const [quizSlot, setQuizSlot] = useState<QuizSlot>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<QuizMeta>({ title: DEFAULT_TITLE, subtitle: DEFAULT_SUBTITLE });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const version = useRef(0);
  const loaded = useRef<{ target: QuizTarget; snapshot: LoadedQuiz } | null>(null);
  const saving = useRef(false);
  const loadQuiz = useCallback(async (slot: QuizSlot = 1) => {
    const request = ++version.current;
    const target: QuizTarget = customId ? { kind: 'custom', id: customId } : { kind: 'legacy', slot };
    loaded.current = null;
    setLoading(true); setLoadError(''); setQuizSlot(slot);
    try {
      const snapshot = await loadQuizData(target);
      if (request !== version.current) return;
      loaded.current = { target, snapshot };
      setCategories(snapshot.data.categories); setMeta(snapshot.data.meta);
    } catch (error) {
      if (request === version.current) setLoadError(error instanceof Error ? error.message : 'Quiz konnte nicht geladen werden.');
    } finally { if (request === version.current) setLoading(false); }
  }, [customId]);
  useEffect(() => { void loadQuiz(1); return () => { version.current++; loaded.current = null; }; }, [loadQuiz]);
  const save = async (next: Category[], nextMeta: QuizMeta) => {
    const current = loaded.current;
    if (!current || saving.current) throw new Error('Quiz ist noch nicht bereit oder wird gerade gespeichert.');
    const request = version.current;
    saving.current = true;
    try {
      const payload = { ...current.snapshot.data, categories: next, meta: nextMeta };
      const snapshot = await saveQuizData(current.target, current.snapshot, payload);
      if (request !== version.current) return;
      loaded.current = { target: current.target, snapshot };
      setCategories(snapshot.data.categories); setMeta(snapshot.data.meta);
    } finally { saving.current = false; }
  };
  const reset = async () => {
    await save(structuredClone(CATEGORIES), { title: customId ? meta.title : quizSlot === 1 ? DEFAULT_TITLE : `Quiz ${quizSlot}`, subtitle: DEFAULT_SUBTITLE });
  };
  return { categories, meta, save, reset, quizSlot, loadQuiz, loading, loadError, pointValues: POINT_VALUES };
}
