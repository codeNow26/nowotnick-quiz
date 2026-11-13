import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createQuiz } from '@/lib/quiz-repository';
export function CreateQuiz() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  return <>
    <Button variant="outline" className="rounded-xl" onClick={() => { setError(''); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Neues Quiz erstellen</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="rounded-2xl border-white/15 bg-background">
        <DialogTitle>Dein neues Quiz</DialogTitle>
        <DialogDescription>Es erhält einen eigenen Link und erscheint nicht in der Quiz-Auswahl auf der Startseite. Die Verwaltung ist vorerst öffentlich und nicht geschützt.</DialogDescription>
        <form className="space-y-4" onSubmit={async e => {
          e.preventDefault(); if (busy) return; setBusy(true); setError('');
          try { const quiz = await createQuiz(name); await navigate({ to: '/quiz/$slug', params: { slug: quiz.slug }, search: { edit: true } }); setOpen(false); }
          catch (e) { setError(e instanceof Error ? e.message : 'Erstellen fehlgeschlagen.'); }
          finally { setBusy(false); }
        }}>
          <label className="block text-sm space-y-2">Quizname<Input autoFocus required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Weihnachtsquiz 2026" disabled={busy} /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="quiz-action w-full rounded-xl" disabled={busy || !name.trim()}>{busy ? 'Wird erstellt …' : 'Quiz erstellen & bearbeiten'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
