import type { LoadedQuiz, QuizPayload } from '../quiz-repository';
import type { DraftRecord, DraftStorage } from './draft-store';
export type SaveStatus = 'loading' | 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';
export interface AutosaveState {
  value: QuizPayload; status: SaveStatus; ready: boolean; recovery: DraftRecord[];
  error: string; localError: string; localPending: boolean; dirty: boolean;
}
export function serverVersion(source: LoadedQuiz) { return `${source.id}:${source.revision ?? source.updated_at ?? 'initial'}`; }
export class AutosaveController {
  private source: LoadedQuiz;
  private latestServer: LoadedQuiz;
  private edit = 0;
  private savedEdit = 0;
  private sequence = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private inFlight?: Promise<boolean>;
  private localWrite: Promise<void> = Promise.resolve();
  private stopped = false;
  private detached = false;
  private recovered?: DraftRecord;
  private recoveryPending = false;
  readonly id = crypto.randomUUID();
  state: AutosaveState;
  constructor(readonly key: string, source: LoadedQuiz, private storage: DraftStorage,
    private save: (before: LoadedQuiz, value: QuizPayload) => Promise<LoadedQuiz>,
    private notify: (state: AutosaveState) => void, private onSaved: (source: LoadedQuiz) => void,
    private delay = 1500) {
    this.source = source; this.latestServer = source;
    this.state = { value: structuredClone(source.data), status:'loading', ready:false, recovery:[], error:'', localError:'', localPending:false, dirty:false };
  }
  private emit(patch: Partial<AutosaveState> = {}) { this.state = { ...this.state, ...patch }; if(!this.stopped && !this.detached) this.notify(this.state); }
  async start() {
    try {
      const candidates = await this.storage.list(this.key);
      if(this.stopped) return;
      const recovery = candidates.filter(r => JSON.stringify(r.value) !== JSON.stringify(this.source.data));
      this.recoveryPending = recovery.length > 0;
      this.emit({ recovery });
      await this.storage.prepare(this.source);
      this.emit({ recovery, ready:true, status:'saved' });
    } catch(e) { this.emit({ ready:true, status:'error', localError: 'Lokale Sicherung nicht bereit: '+this.message(e) }); }
  }
  private message(e: unknown) { return e instanceof Error ? e.message : 'Speichern fehlgeschlagen.'; }
  private record(): DraftRecord { return { schema:1, id:this.id, quizKey:this.key, sequence:++this.sequence, updatedAt:Date.now(), dirty:this.edit!==this.savedEdit, source:structuredClone(this.source), value:structuredClone(this.state.value) }; }
  private persist() {
    const record=this.record(); this.emit({ localPending:true });
    this.localWrite=this.storage.write(record).then(async () => {
      if(record.sequence===this.sequence) this.emit({localPending:false,localError:''});
      if(!record.dirty) await this.storage.remove(record).catch(()=>{});
    }).catch(e => { if(record.sequence===this.sequence) this.emit({localPending:false,localError:'Lokale Sicherung fehlgeschlagen: '+this.message(e)}); });
  }
  update(value: QuizPayload) {
    if(!this.state.ready || this.recoveryPending) return;
    this.edit++;
    this.emit({ value, dirty:true, status:this.state.status==='conflict' ? 'conflict' : 'dirty', error:this.state.status==='conflict' ? this.state.error : '' });
    this.persist(); this.schedule();
  }
  private schedule() {
    clearTimeout(this.timer);
    if(!this.stopped && !this.detached && !this.recoveryPending && this.state.status!=='conflict') this.timer=setTimeout(()=>void this.flush(),this.delay);
  }
  async flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if(this.stopped || this.recoveryPending || this.state.status==='conflict') return false;
    if(this.inFlight) { await this.inFlight; return this.edit===this.savedEdit ? true : (['error','conflict'] as SaveStatus[]).includes(this.state.status) ? false : this.flush(); }
    if(this.edit===this.savedEdit) return true;
    const sentEdit=this.edit; const value=structuredClone(this.state.value);
    this.emit({status:'saving', error:''});
    const work=async () => {
      try {
        const snapshot=await this.save(this.source,value);
        this.source=snapshot;this.latestServer=snapshot;this.savedEdit=sentEdit;
        this.emit({value:this.edit===sentEdit?structuredClone(snapshot.data):this.state.value,dirty:this.edit!==this.savedEdit,status:this.edit===this.savedEdit?'saved':'dirty'});
        this.persist();
        if(!this.stopped) this.onSaved(snapshot);
        if(this.recovered) { const old=this.recovered; this.recovered=undefined; await this.storage.remove(old).catch(()=>{}); }
        return true;
      } catch(e) {
        const conflict=(e as {code?:string})?.code==='CONFLICT';
        this.emit({status:conflict?'conflict':'error',error:this.message(e),dirty:true});
        return false;
      }
    };
    this.inFlight=work();
    const ok=await this.inFlight;this.inFlight=undefined;
    if(ok && this.edit!==this.savedEdit) this.schedule();
    return ok && this.edit===this.savedEdit;
  }
  restore(record: DraftRecord) {
    if(record.quizKey!==this.key) throw new Error('Dieser Entwurf gehört zu einem anderen Quiz.');
    this.recoveryPending=false;this.recovered=record;
    const conflict=serverVersion(record.source)!==serverVersion(this.latestServer);
    this.source=record.source;
    this.emit({recovery:[],status:conflict?'conflict':'dirty',error:conflict?'Der Online-Stand hat sich seit diesem Entwurf geändert. Automatisches Speichern pausiert.':''});
    this.update(structuredClone(record.value));
  }
  useOnline() { this.recoveryPending=false;this.emit({recovery:[],status:'saved'}); }
  async discard(record: DraftRecord) { await this.storage.remove(record);this.emit({recovery:this.state.recovery.filter(r=>r.id!==record.id)});if(!this.state.recovery.length)this.recoveryPending=false; }
  async rebase(server: LoadedQuiz) {
    // Only called after explicit confirmation; CAS still rejects subsequent remote edits.
    if(this.inFlight) await this.inFlight;
    if(server.id!==this.source.id) throw new Error('Falsches Quiz.');
    this.source=server;this.latestServer=server;
    this.emit({status:'dirty',error:''});this.persist();return this.flush();
  }
  async localSettled() { await this.localWrite; return !this.state.localError; }
  prepareImage(image: string) { return this.storage.prepare(image); }
  dispose() {
    this.detached=true;clearTimeout(this.timer);
    if(this.state.ready && this.state.dirty && !this.recoveryPending && this.state.status!=='conflict') {
      void this.flush().finally(()=>{ this.stopped=true; });
    } else this.stopped=true;
  }
}
