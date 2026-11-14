import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadQuizVideo } from '@/lib/quiz-video';
import { QuestionVideo } from './QuestionVideo';

interface Props {
  quizId: string;
  value?: string;
  onChange: (url: string) => void;
  onPending: (pending: boolean) => void;
}
export function QuestionVideoEditor({ quizId, value, onChange, onPending }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const pendingCallback = useRef(onPending);
  pendingCallback.current = onPending;
  const inFlight = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; pendingCallback.current(false); };
  }, []);
  const upload = async (file?: File) => {
    if (!file || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); onPending(true);
    try {
      const url = await uploadQuizVideo(quizId, file);
      if (alive.current) onChange(url);
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : 'Video konnte nicht hochgeladen werden.');
    } finally {
      inFlight.current = false;
      if (alive.current) { setBusy(false); pendingCallback.current(false); }
    }
  };
  return <section className="space-y-2 rounded-xl border border-white/10 p-3">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">Video · optional</p>
    <label className={`flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5 focus-within:ring-2 focus-within:ring-primary ${busy ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
      <Upload className="h-4 w-4" />{busy ? 'Video wird hochgeladen …' : value ? 'Video ersetzen' : 'Video vom PC auswählen'}
      <input type="file" className="sr-only" accept="video/mp4,video/webm" disabled={busy}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }} />
    </label>
    <p className="text-xs text-muted-foreground">MP4 oder WebM, maximal 50 MB. Wiedergabe per Klick. Hochgeladene Videos sind über ihren Link öffentlich abrufbar.</p>
    {busy && <p role="status" className="text-xs text-muted-foreground">Bitte den Editor bis zum Abschluss des Uploads geöffnet lassen.</p>}
    {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
    {value && <><QuestionVideo src={value} /><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange('')}><Trash2 className="mr-2 h-4 w-4" />Video aus dieser Frage entfernen</Button></>}
  </section>;
}
