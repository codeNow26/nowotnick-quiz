import assert from 'node:assert/strict';
import { AutosaveController, serverVersion } from '../src/lib/autosave/controller.ts';
import { normalizeColors, PLAYER_PALETTE, selectPlayerColor, playerColor } from '../src/lib/player-preferences.ts';
import type { DraftRecord, DraftStorage } from '../src/lib/autosave/draft-store.ts';
import type { LoadedQuiz, QuizPayload } from '../src/lib/quiz-repository.ts';
const clone=<T>(v:T):T=>structuredClone(v);
const payload=(answer='Alt'):QuizPayload=>({meta:{title:'Quiz',subtitle:''},categories:[{name:'Kategorie',questions:Array.from({length:5},()=>({question:'Frage',answer,imageUrl:'data:image/webp;base64,IMAGE'}))}],extra:{keep:true}});
const source=(id='quiz-a',revision=1):LoadedQuiz=>({id,revision,updated_at:'2026-11-13T00:00:00Z',data:payload()});
class MemoryStorage implements DraftStorage {
  rows=new Map<string,DraftRecord>(); fail=false;
  async prepare(){};
  async list(key:string){return [...this.rows.values()].filter(r=>r.quizKey===key&&r.dirty).map(clone);}
  async write(record:DraftRecord){if(this.fail)throw Error('quota');this.rows.set(record.id,clone(record));}
  async remove(record:DraftRecord){if(this.rows.get(record.id)?.sequence===record.sequence)this.rows.delete(record.id);}
}
const tick=()=>new Promise(r=>setTimeout(r,0));
const storage=new MemoryStorage();
let pending:((s:LoadedQuiz)=>void)[]=[];let requests:{before:LoadedQuiz;value:QuizPayload}[]=[];let active=0;let maxActive=0;
const save=(before:LoadedQuiz,value:QuizPayload)=>{requests.push(clone({before,value}));active++;maxActive=Math.max(active,maxActive);return new Promise<LoadedQuiz>(resolve=>pending.push(s=>{active--;resolve(s);}));};
const c=new AutosaveController('custom:quiz-a',source(),storage,save,()=>{},()=>{},60000);
await c.start();assert.equal(requests.length,0,'Opening the editor must not write server defaults');
c.update(payload('Erster Entwurf'));
assert.equal([...storage.rows.values()][0].value.categories[0].questions[0].answer,'Erster Entwurf','Local write starts in the change handler');
const first=c.flush();
c.update(payload('Neuster Entwurf'));
const second=c.flush();
assert.equal(requests.length,1);
pending.shift()!({...source(),revision:2,data:payload('Erster Entwurf')});
await first;await tick();
assert.equal(c.state.value.categories[0].questions[0].answer,'Neuster Entwurf','Older server ack cannot reset newer editor text');
assert.equal(requests.length,2);assert.equal(requests[1].before.revision,2);
pending.shift()!({...source(),revision:3,data:payload('Neuster Entwurf')});
await second;assert.equal(maxActive,1);assert.equal(c.state.status,'saved');
await c.localSettled();assert.equal(storage.rows.size,0,'Clean acknowledged drafts are removed without deleting newer edits');
c.dispose();
// Lost connectivity: full image/text draft survives a new controller.
const offlineStore=new MemoryStorage();
const offline=new AutosaveController('custom:quiz-a',source(),offlineStore,async()=>{throw Error('offline');},()=>{},()=>{},60000);
await offline.start();offline.update(payload('Offline'));await offline.flush();assert.equal(offline.state.status,'error');
const local=(await offlineStore.list('custom:quiz-a'))[0];assert.equal(local.value.categories[0].questions[0].imageUrl,'data:image/webp;base64,IMAGE');
offline.dispose();await tick();
let restoredCalls=0;
const restored=new AutosaveController('custom:quiz-a',source(),offlineStore,async(before,value)=>{restoredCalls++;return {...before,revision:2,data:value};},()=>{},()=>{},60000);
await restored.start();assert.equal(restored.state.recovery.length,1);assert.equal(restoredCalls,0);
restored.restore(restored.state.recovery[0]);await restored.flush();assert.equal(restoredCalls,1);assert.equal(restored.state.value.categories[0].questions[0].answer,'Offline');restored.dispose();
// A server change pauses recovery until explicit adoption, without losing local edits.
const conflictStore=new MemoryStorage();await conflictStore.write({...local,id:'old-session',sequence:3});
let conflictWrites=0;
const conflict=new AutosaveController('custom:quiz-a',source('quiz-a',9),conflictStore,async(before,value)=>{conflictWrites++;return {...before,revision:before.revision!+1,data:value};},()=>{},()=>{},60000);
await conflict.start();conflict.restore(conflict.state.recovery[0]);assert.equal(conflict.state.status,'conflict');await conflict.flush();assert.equal(conflictWrites,0);
conflict.update(payload('Konflikt lokal weiterbearbeitet'));assert.equal(conflict.state.status,'conflict');
await conflict.rebase(source('quiz-a',9));assert.equal(conflictWrites,1);assert.equal(conflict.state.value.categories[0].questions[0].answer,'Konflikt lokal weiterbearbeitet');conflict.dispose();
// Quiz isolation and multi-tab local isolation.
const other=new AutosaveController('custom:quiz-b',source('quiz-b'),conflictStore,async()=>{throw Error('unexpected');},()=>{},()=>{},60000);await other.start();assert.equal(other.state.recovery.length,0);assert.throws(()=>other.restore(local),/anderen Quiz/);other.dispose();
const failures=new MemoryStorage();const failed=new AutosaveController('legacy:quiz-a',source(),failures,async()=>{throw Object.assign(Error('Remote changed'),{code:'CONFLICT'});},()=>{},()=>{},60000);
await failed.start();failures.fail=true;failed.update(payload('Keep me'));await failed.localSettled();assert.match(failed.state.localError,/quota/);await failed.flush();assert.equal(failed.state.status,'conflict');assert.equal(failed.state.value.categories[0].questions[0].answer,'Keep me');failed.dispose();
// Debounce coalesces keystrokes.
let debouncedWrites=0;const debounced=new AutosaveController('custom:quiz-c',source('quiz-c'),new MemoryStorage(),async(before,value)=>{debouncedWrites++;return {...before,revision:2,data:value};},()=>{},()=>{},15);
await debounced.start();debounced.update(payload('a'));debounced.update(payload('ab'));debounced.update(payload('abc'));
await new Promise(r=>setTimeout(r,35));assert.equal(debouncedWrites,1);debounced.dispose();
// Leaving the editor drains the queued newest save after an in-flight request.
const leaving=new AutosaveController('custom:quiz-a',source(),new MemoryStorage(),save,()=>{},()=>{},60000);await leaving.start();leaving.update(payload('Vor Verlassen'));const sending=leaving.flush();leaving.update(payload('Letzter Tastendruck'));leaving.dispose();pending.shift()!({...source(),revision:2});await sending;await tick();assert.equal(requests.at(-1)!.value.categories[0].questions[0].answer,'Letzter Tastendruck');pending.shift()!({...source(),revision:3});await tick();
assert.notEqual(serverVersion(source('quiz-a')),serverVersion(source('quiz-b')));
assert.equal(PLAYER_PALETTE.length,16);assert.equal(new Set(normalizeColors(['#60a5fa','#60a5fa','invalid'])).size,4);
const colors=normalizeColors([]);assert.deepEqual(selectPlayerColor(colors,0,colors[1],4),colors,'Used color cannot be assigned twice');
const chosen=selectPlayerColor(colors,0,PLAYER_PALETTE[7].color,4);assert.equal(chosen[0],PLAYER_PALETTE[7].color);assert.equal(playerColor(0,chosen[0]),chosen[0]);
console.log('PASS autosave: synchronous local capture, serial writes, stale acknowledgements, offline images, recovery, conflicts, isolation, quota failures, debounce, exit flush; unique player colors.');

const partial=normalizeColors(['',PLAYER_PALETTE[0].color,'',PLAYER_PALETTE[8].color]);
assert.equal(partial[1],PLAYER_PALETTE[0].color);
assert.equal(partial[3],PLAYER_PALETTE[8].color);
assert.equal(new Set(partial).size,4);
