import type { LoadedQuiz, QuizPayload } from '../quiz-repository';
export interface DraftRecord {
  schema: 1; id: string; quizKey: string; sequence: number; updatedAt: number;
  dirty: boolean; source: LoadedQuiz; value: QuizPayload;
}
export interface DraftStorage {
  list(key: string): Promise<DraftRecord[]>;
  write(record: DraftRecord): Promise<void>;
  remove(record: DraftRecord): Promise<void>;
  prepare(value: unknown): Promise<void>;
}
const PREFIX = 'nowotnick:draft:v1:';
const DB_NAME = 'nowotnick-quiz-drafts';
const imageIds = new Map<string, string>();
let opening: Promise<IDBDatabase> | undefined;
function database() {
  if (!opening) opening = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('drafts', { keyPath: 'id' }); req.result.createObjectStore('images'); };
    req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); opening = undefined; }; resolve(req.result); };
    req.onerror = () => { opening = undefined; reject(req.error); };
    req.onblocked = () => { opening = undefined; reject(new Error('Lokaler Speicher wird durch einen anderen Tab blockiert.')); };
  });
  return opening;
}
async function transaction<T>(store: string, mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode); const req = work(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error); tx.onabort = () => reject(tx.error ?? new Error('Lokale Sicherung abgebrochen.'));
  });
}
async function prepare(value: unknown): Promise<void> {
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    if (imageIds.has(value)) return;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    const id = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    await transaction('images', 'readwrite', s => s.put(value, id));
    imageIds.set(value, id); // only reference an image after its transaction committed
  } else if (Array.isArray(value)) { for (const item of value) await prepare(item); }
  else if (value && typeof value === 'object') { for (const item of Object.values(value)) await prepare(item); }
}
function packed(record: DraftRecord) {
  return JSON.parse(JSON.stringify(record, (_key, value) => typeof value === 'string' && imageIds.has(value) ? { __quizImage: imageIds.get(value) } : value));
}
async function unpack(value: any): Promise<any> {
  if (value && typeof value === 'object' && typeof value.__quizImage === 'string') {
    const image = await transaction('images', 'readonly', s => s.get(value.__quizImage));
    if (typeof image !== 'string') throw new Error('Ein Bild im lokalen Entwurf ist nicht verfügbar. Der Entwurf wurde nicht gelöscht.');
    imageIds.set(image, value.__quizImage); return image;
  }
  if (Array.isArray(value)) return Promise.all(value.map(unpack));
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k,v]) => [k, await unpack(v)])));
  return value;
}
export function createDraftStorage(): DraftStorage {
  let queue: Promise<unknown> = Promise.resolve();
  const latest = new Map<string, number>();
  return {
    prepare,
    async list(quizKey) {
      const merged = new Map<string, any>(); let accessible = false;
      try { for (const row of await transaction<any[]>('drafts', 'readonly', s => s.getAll())) merged.set(row.id, row); accessible = true; } catch { /* synchronous journal remains usable */ }
      try {
        for (let i=0; i<localStorage.length; i++) {
          const key = localStorage.key(i)!; if (!key.startsWith(PREFIX)) continue;
          try { const row = JSON.parse(localStorage.getItem(key)!); if (!merged.has(row.id) || merged.get(row.id).sequence < row.sequence) merged.set(row.id,row); } catch { /* never overwrite unreadable entries */ }
        }
        accessible = true;
      } catch { /* surfaced below */ }
      if (!accessible) throw new Error('Der Browser erlaubt keine lokale Entwurfssicherung. Bitte Browserspeicher freigeben.');
      const matching = [...merged.values()].filter(r => r.schema === 1 && r.quizKey === quizKey && r.dirty);
      return (await Promise.all(matching.map(unpack))).sort((a,b) => b.updatedAt-a.updatedAt);
    },
    write(record) {
      // Synchronous journal runs inside the input handler, before React renders.
      latest.set(record.id, record.sequence);
      let journalSaved = false;
      try { localStorage.setItem(PREFIX + record.id, JSON.stringify(packed(record))); journalSaved = true; } catch { /* IDB can hold much larger drafts */ }
      const task = queue.catch(() => {}).then(async () => {
        try {
          await prepare(record);
          const row = packed(record);
          await transaction('drafts','readwrite',s => s.put(row));
          if (latest.get(record.id) === record.sequence) {
            try { localStorage.setItem(PREFIX+record.id, JSON.stringify(row)); } catch { /* full copy is committed to IndexedDB */ }
          }
        } catch (error) { if (!journalSaved) throw error; }
      });
      queue = task; return task;
    },
    async remove(record) {
      // Compare version: another tab's newer draft must never be removed.
      await queue.catch(() => {});
      try {
        const db = await database();
        await new Promise<void>((resolve,reject) => {
          const tx=db.transaction('drafts','readwrite'); const s=tx.objectStore('drafts'); const req=s.get(record.id);
          req.onsuccess=()=>{ if(req.result?.sequence===record.sequence) s.delete(record.id); };
          tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
        });
      } catch { /* journal may be the only available storage */ }
      const row=JSON.parse(localStorage.getItem(PREFIX+record.id) ?? 'null');
      if(row?.sequence===record.sequence) localStorage.removeItem(PREFIX+record.id);
    },
  };
}
