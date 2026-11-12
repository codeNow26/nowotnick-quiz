import { supabase } from './supabase';
import { POINT_VALUES, type Category } from './jeopardy-data';

export const QUIZ_IDS = {
  1: '2f167918-a027-44f0-a012-422e802a7bef',
  2: '1dd72322-8420-43a8-a504-6665757232c6',
  3: '6a14ed4b-febe-483e-bf11-8211daa4b947',
  4: 'ba7f1a27-2381-4c78-9967-e35679b112a8',
} as const;
export type QuizSlot = keyof typeof QUIZ_IDS;
export interface QuizMeta { title: string; subtitle: string }
export interface QuizPayload { categories: Category[]; meta: QuizMeta; [key: string]: unknown }
export interface CustomQuiz { id: string; slug: string; title: string; data: QuizPayload; archived: boolean; revision: number; updated_at: string }
export type QuizSummary = Omit<CustomQuiz, 'data'>;
export type QuizTarget = { kind: 'legacy'; slot: QuizSlot } | { kind: 'custom'; id: string };
export interface LoadedQuiz { id: string; data: QuizPayload; revision?: number; updated_at: string | null }
const CUSTOM_TABLE = 'custom_quizzes';

export function validPayload(value: unknown): value is QuizPayload {
  const d = value as QuizPayload | null;
  return !!d && !!d.meta && typeof d.meta.title === 'string' && typeof d.meta.subtitle === 'string'
    && Array.isArray(d.categories) && d.categories.length >= 1 && d.categories.length <= 10
    && d.categories.every(c => typeof c?.name === 'string' && Array.isArray(c.questions)
      && c.questions.length === 5 && c.questions.every(q => typeof q?.question === 'string' && typeof q.answer === 'string'));
}
export function slugify(name: string) {
  return name.trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '') || 'quiz';
}
export function emptyQuiz(name: string): QuizPayload {
  return { meta: { title: name.trim(), subtitle: '' }, categories: Array.from({ length: 6 }, (_, i) => ({
    name: `Kategorie ${i + 1}`, questions: POINT_VALUES.map(value => ({ question: '', answer: '', value, type: 'normal' as const })),
  })) };
}
function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === '42P01' || error.code === 'PGRST205') throw new Error('Die neue Quiz-Verwaltung ist noch nicht eingerichtet. Bitte zuerst das SQL aus der Einrichtungsanleitung ausführen. Die vier bestehenden Quizze bleiben verfügbar.');
  throw new Error(error.message);
}
export function targetTable(target: QuizTarget) { return target.kind === 'legacy' ? 'quiz_data' : CUSTOM_TABLE; }
export function targetId(target: QuizTarget) { return target.kind === 'legacy' ? QUIZ_IDS[target.slot] : target.id; }
export async function loadQuizData(target: QuizTarget): Promise<LoadedQuiz> {
  const { data, error } = await supabase.from(targetTable(target)).select(target.kind === 'legacy' ? 'id,data,updated_at' : 'id,data,updated_at,revision').eq('id', targetId(target)).returns<LoadedQuiz[]>().single();
  check(error);
  if (!data || !validPayload(data.data)) throw new Error('Quizdaten fehlen oder haben ein unerwartetes Format. Es wurde nichts zurückgesetzt oder überschrieben.');
  return data as LoadedQuiz;
}
export async function saveQuizData(target: QuizTarget, before: LoadedQuiz, payload: QuizPayload): Promise<LoadedQuiz> {
  if (before.id !== targetId(target)) throw new Error('Quiz-Zuordnung stimmt nicht überein. Speichern wurde abgebrochen.');
  if (!validPayload(payload)) throw new Error('Ungültige Quizdaten. Speichern wurde abgebrochen.');
  let query = supabase.from(targetTable(target)).update({ data: payload, updated_at: new Date().toISOString() }).eq('id', before.id);
  query = target.kind === 'custom' ? query.eq('revision', before.revision!)
    : before.updated_at === null ? query.is('updated_at', null) : query.eq('updated_at', before.updated_at);
  const { data, error } = await query.select(target.kind === 'legacy' ? 'id,data,updated_at' : 'id,data,updated_at,revision').returns<LoadedQuiz[]>().maybeSingle();
  check(error);
  if (!data) throw new Error('Dieses Quiz wurde inzwischen verändert oder gelöscht. Deine Eingaben bleiben im Editor. Sichere sie und lade das Quiz neu.');
  return data as LoadedQuiz;
}
export async function findQuiz(slug: string): Promise<CustomQuiz> {
  const { data, error } = await supabase.from(CUSTOM_TABLE).select('*').eq('slug', slug).maybeSingle();
  check(error);
  if (!data) throw new Error('Dieses Quiz wurde nicht gefunden. Prüfe die URL; möglicherweise wurde es gelöscht.');
  return data as CustomQuiz;
}
export async function createQuiz(name: string, source?: QuizPayload): Promise<CustomQuiz> {
  const title = name.trim();
  if (!title || title.length > 120) throw new Error('Bitte einen Namen mit 1 bis 120 Zeichen eingeben.');
  const payload = source ? structuredClone(source) : emptyQuiz(title);
  payload.meta = { ...payload.meta, title };
  if (!validPayload(payload)) throw new Error('Das Quellquiz ist unvollständig und kann nicht dupliziert werden.');
  const base = slugify(title);
  // The unique constraint resolves races between simultaneous creations.
  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    const { data, error } = await supabase.from(CUSTOM_TABLE).insert({ slug, data: payload }).select('*').single();
    if (error?.code === '23505') continue;
    check(error);
    if (!data) throw new Error('Quiz konnte nicht angelegt werden.');
    return data as CustomQuiz;
  }
}
export async function listQuizzes(archived: boolean, page: number, search: string) {
  let query = supabase.from(CUSTOM_TABLE).select('id,slug,title,archived,revision,updated_at', { count: 'exact' }).eq('archived', archived);
  const term = search.trim().replace(/[\\%_]/g, '');
  if (term) query = query.ilike('title', `%${term}%`);
  const { data, count, error } = await query.order('updated_at', { ascending: false }).order('id').range(page * 24, page * 24 + 23);
  check(error); return { rows: (data ?? []) as QuizSummary[], count: count ?? 0 };
}
export async function updateQuizInfo(quiz: CustomQuiz | QuizSummary, patch: { archived?: boolean; data?: QuizPayload }) {
  const { data, error } = await supabase.from(CUSTOM_TABLE).update(patch).eq('id', quiz.id).eq('revision', quiz.revision).select('id').maybeSingle();
  check(error); if (!data) throw new Error('Das Quiz wurde inzwischen verändert. Bitte die Übersicht neu laden.');
}
export async function renameQuiz(quiz: QuizSummary, title: string) {
  const current = await findQuiz(quiz.slug);
  if (current.revision !== quiz.revision) throw new Error('Das Quiz wurde inzwischen verändert. Bitte die Übersicht neu laden.');
  if (!title.trim() || title.trim().length > 120) throw new Error('Bitte einen Namen mit 1 bis 120 Zeichen eingeben.');
  await updateQuizInfo(current, { data: { ...current.data, meta: { ...current.data.meta, title: title.trim() } } });
}
export async function deleteQuiz(quiz: QuizSummary) {
  const { data, error } = await supabase.from(CUSTOM_TABLE).delete().eq('id', quiz.id).eq('revision', quiz.revision).select('id').maybeSingle();
  check(error); if (!data) throw new Error('Das Quiz wurde inzwischen verändert oder bereits gelöscht. Bitte die Übersicht neu laden.');
}
