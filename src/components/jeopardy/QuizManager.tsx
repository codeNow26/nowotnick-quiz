import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Archive, ArrowLeft, Copy, ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreateQuiz } from './CreateQuiz';
import { createQuiz, deleteQuiz, findQuiz, listQuizzes, renameQuiz, updateQuizInfo, type QuizSummary } from '@/lib/quiz-repository';

type Action = { type: 'rename' | 'delete' | 'duplicate'; quiz: QuizSummary };
export function QuizManager() {
  const [rows, setRows] = useState<QuizSummary[]>([]);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [name, setName] = useState('');
  const request = useRef(0);
  const navigate = useNavigate();
  useEffect(() => {
    const current = ++request.current;
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      void listQuizzes(archived, page, search).then(result => {
        if (current !== request.current) return;
        if (page > 0 && result.rows.length === 0) { setPage(page - 1); return; }
        setRows(result.rows); setCount(result.count);
      }).catch(e => { if (current === request.current) setError(e.message); })
        .finally(() => { if (current === request.current) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); request.current++; };
  }, [archived, page, search, refresh]);
  const run = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await work(); setAction(null); setRefresh(x => x + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white"><ArrowLeft size={16} />Zur Startseite</Link>
    <header className="my-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-primary text-sm mb-2">NOWOTNICK QUIZ</p><h1 className="font-display text-3xl md:text-5xl">Quiz-Verwaltung</h1></div><CreateQuiz /></header>
    <p className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-100">Öffentliche Verwaltung ohne Anmeldung: Alle Besucher dieser Seite können die neuen Quizze sehen, bearbeiten und löschen. Hier findest du geräteübergreifend auch deine erstellten Quizze. Die vier ursprünglichen Quizze bleiben auf der Startseite und werden hier nicht verwaltet.</p>
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="flex gap-2"><Button variant={archived ? 'outline' : 'default'} onClick={() => { setArchived(false); setPage(0); }}>Aktive Quizze</Button><Button variant={archived ? 'default' : 'outline'} onClick={() => { setArchived(true); setPage(0); }}>Archiv</Button></div>
      <Input aria-label="Quiz suchen" placeholder="Quiz suchen …" className="w-full sm:w-64 sm:ml-auto" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
      <Button variant="outline" disabled={loading} onClick={() => setRefresh(x => x + 1)}>Neu laden</Button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/40 p-4 text-destructive">{error}</p>}
    {notice && <p role="status" className="mb-4 text-emerald-300">{notice}</p>}
    {loading ? <p role="status" className="py-12 text-center text-muted-foreground">Quizze werden geladen …</p> : !error && rows.length === 0 ? <div className="glass rounded-2xl p-10 text-center text-muted-foreground">{archived ? 'Noch keine archivierten Quizze.' : search ? 'Keine passenden Quizze gefunden.' : 'Hier ist Platz für dein nächstes Quiz.'}</div> : !loading && !error && <div className="grid gap-4 md:grid-cols-2">
      {rows.map(quiz => <article key={quiz.id} className="glass-strong rounded-2xl border border-white/10 p-5 min-w-0">
        <h2 className="font-display text-xl break-words">{quiz.title}</h2>
        <p className="my-2 text-sm text-muted-foreground break-all">/quiz/{quiz.slug}</p>
        <p className="mb-4 text-xs text-muted-foreground">{archived ? 'Archiviert · Link bleibt erreichbar' : 'Über individuellen Link erreichbar'}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to="/quiz/$slug" params={{ slug: quiz.slug }} search={{ edit: false }}><ExternalLink size={14} className="mr-1" />Öffnen</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/quiz/$slug" params={{ slug: quiz.slug }} search={{ edit: true }}><Pencil size={14} className="mr-1" />Bearbeiten</Link></Button>
          <Button size="sm" variant="outline" onClick={async () => { const url = `${window.location.origin}/quiz/${quiz.slug}`; try { await navigator.clipboard.writeText(url); setNotice('Quiz-Link kopiert.'); } catch { setNotice(`Bitte diesen Link kopieren: ${url}`); } }}><Copy size={14} className="mr-1" />Link kopieren</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setError(''); setName(quiz.title); setAction({ type: 'rename', quiz }); }}>Umbenennen</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setError(''); setName(`${quiz.title} Kopie`.slice(0,120)); setAction({ type: 'duplicate', quiz }); }}>Duplizieren</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(async () => { await updateQuizInfo(quiz, { archived: !archived }); setNotice(archived ? 'Quiz wiederhergestellt.' : 'Quiz archiviert. Sein Link funktioniert weiterhin.'); })}>{archived ? <RotateCcw size={14} className="mr-1" /> : <Archive size={14} className="mr-1" />}{archived ? 'Wiederherstellen' : 'Archivieren'}</Button>
          <Button size="sm" variant="ghost" className="text-red-300" disabled={busy} onClick={() => { setError(''); setName(''); setAction({ type: 'delete', quiz }); }}><Trash2 size={14} className="mr-1" />Löschen</Button>
        </div>
      </article>)}
    </div>}
    {!loading && count > 24 && <nav aria-label="Seiten" className="my-6 flex items-center justify-center gap-4"><Button variant="outline" disabled={page === 0} onClick={() => setPage(x => x - 1)}>Zurück</Button><span>{page + 1} / {Math.ceil(count / 24)}</span><Button variant="outline" disabled={(page + 1) * 24 >= count} onClick={() => setPage(x => x + 1)}>Weiter</Button></nav>}
    <Dialog open={!!action} onOpenChange={open => { if (!open && !busy) setAction(null); }}><DialogContent className="rounded-2xl border-white/15 bg-background">
      <DialogTitle>{action?.type === 'delete' ? 'Quiz endgültig löschen?' : action?.type === 'duplicate' ? 'Quiz duplizieren' : 'Quiz umbenennen'}</DialogTitle>
      <DialogDescription>{action?.type === 'delete' ? `Alle Inhalte von „${action.quiz.title}“ werden gelöscht. Der Link funktioniert danach nicht mehr. Gib zur Bestätigung LÖSCHEN ein.` : action?.type === 'rename' ? 'Der bestehende Link bleibt erhalten, damit geteilte URLs weiter funktionieren.' : 'Alle Fragen, Antworten, Bilder und Einstellungen werden in einen unabhängigen Datensatz mit neuem Link kopiert.'}</DialogDescription>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!action) return; void run(async () => {
        if (action.type === 'delete') { if (name !== 'LÖSCHEN') return; await deleteQuiz(action.quiz); setNotice('Quiz gelöscht.'); }
        else if (action.type === 'rename') { await renameQuiz(action.quiz, name); setNotice('Quiz umbenannt. Der Link bleibt unverändert.'); }
        else { const original = await findQuiz(action.quiz.slug); const copy = await createQuiz(name, original.data); await navigate({ to: '/quiz/$slug', params: { slug: copy.slug }, search: { edit: true } }); }
      }); }}>
        <label className="block text-sm space-y-2">{action?.type === 'delete' ? 'Bestätigung' : 'Quizname'}<Input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={120} disabled={busy} required /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant={action?.type === 'delete' ? 'destructive' : 'default'} disabled={busy || (action?.type === 'delete' ? name !== 'LÖSCHEN' : !name.trim())} className="w-full">{busy ? 'Wird gespeichert …' : action?.type === 'delete' ? 'Endgültig löschen' : 'Bestätigen'}</Button>
      </form>
    </DialogContent></Dialog>
  </main>;
}
