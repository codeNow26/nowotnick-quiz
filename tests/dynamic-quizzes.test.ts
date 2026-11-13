import assert from 'node:assert/strict';

// Exercise the real Supabase client against an isolated in-memory HTTP fixture.
// All network access is intercepted; these tests cannot write to the real DB.
const legacy = new Map<string, any>();
const custom = new Map<string, any>();
const requests: { method: string; table: string; id?: string }[] = [];
const fixture = (title: string) => ({ meta: { title, subtitle: 'Untertitel' }, settings: { preserved: true }, categories: [{ name: 'Beispiele', questions: [
  { question: 'Normal', answer: 'Zeile 1\nZeile 2', imageUrl: 'https://example.test/photo.png', value: 100 },
  { question: 'ABCD', answer: 'B', type: 'choice', options: ['A','B','C','D'], correctOption: 1, value: 250 },
  { question: 'Ordnen', answer: 'A → B', type: 'order', orderItems: ['A','B'], value: 500 },
  { question: 'Hinweis', answer: 'Antwort', type: 'hint', hints: ['Tipp 1','Tipp 2'], value: 750 },
  { question: 'Bild', answer: 'Antwort', imageUrl: 'https://example.test/other.png', value: 1000 },
] }] });
const fail = (code: string, message: string, status = 400) => new Response(JSON.stringify({ code, message }), { status, headers: { 'content-type': 'application/json' } });
globalThis.fetch = async (input: any, init: any = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url ?? input.toString());
  const table = url.pathname.split('/').pop()!;
  if (!['quiz_data', 'custom_quizzes'].includes(table)) throw new Error(`Unexpected network request: ${url.pathname}`);
  const method = init.method ?? 'GET';
  const store = table === 'quiz_data' ? legacy : custom;
  const params = url.searchParams;
  const headers = new Headers(init.headers);
  const id = params.get('id')?.replace('eq.', '');
  requests.push({ method, table, id });
  let rows = [...store.values()].filter(row => [...params].every(([key, value]) => {
    if (['select','order','offset','limit'].includes(key)) return true;
    if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
    if (value === 'is.null') return row[key] == null;
    if (value.startsWith('ilike.')) return row[key].toLowerCase().includes(value.slice(6).replaceAll('%','').toLowerCase());
    throw new Error(`Unhandled filter ${key}: ${value}`);
  }));
  if (method === 'POST') {
    const body = JSON.parse(init.body);
    if ([...store.values()].some(row => row.slug === body.slug)) return fail('23505', 'duplicate slug', 409);
    const row = { id: crypto.randomUUID(), ...body, title: body.data.meta.title, archived: false, revision: 1, updated_at: new Date().toISOString() };
    store.set(row.id, row); rows = [row];
  } else if (method === 'PATCH') {
    const body = JSON.parse(init.body);
    rows = rows.map(row => { const next = { ...row, ...body, revision: row.revision + 1, updated_at: new Date().toISOString() };
      if (body.data) next.title = body.data.meta.title;
      store.set(row.id, next); return next;
    });
  } else if (method === 'DELETE') {
    rows.forEach(row => store.delete(row.id));
  }
  const total = rows.length;
  if (params.has('offset')) rows = rows.slice(Number(params.get('offset')));
  if (params.has('limit')) rows = rows.slice(0, Number(params.get('limit')));
  const single = headers.get('accept')?.includes('vnd.pgrst.object');
  if (single && rows.length !== 1) return fail('PGRST116', 'Expected one row', 406);
  return new Response(JSON.stringify(single ? rows[0] : rows), { headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(0, rows.length-1)}/${total}` } });
};
const repo = await import('../src/lib/quiz-repository.ts');
const { QUIZ_IDS, loadQuizData, saveQuizData, createQuiz, findQuiz, renameQuiz, updateQuizInfo, listQuizzes, deleteQuiz, slugify } = repo;
for (const [slot, id] of Object.entries(QUIZ_IDS)) legacy.set(id, { id, data: fixture(`Quiz ${slot}`), updated_at: '2026-11-12T10:00:00Z' });
const before = JSON.stringify([...legacy]);
for (const slot of [1,2,3,4] as const) {
  const loaded = await loadQuizData({ kind: 'legacy', slot });
  assert.equal(loaded.id, QUIZ_IDS[slot]); assert.deepEqual(loaded.data, fixture(`Quiz ${slot}`));
}
assert.equal(slugify('  Fröhliche Grüße & Spaß!  '), 'froehliche-gruesse-spass');
// New quizzes and explicit expansion of older six-category quizzes preserve all content.
const fresh = await createQuiz('Zehn Kategorien');
assert.equal(fresh.data.categories.length, 6);
assert.equal(repo.ensureCategoryCount(fresh.data.categories,10).length,10);
assert.equal(fresh.data.categories.length,6,'Preparing a round must not mutate saved content');
const olderPayload = { ...fixture('Bestehendes Quiz'), categories: repo.emptyQuiz('Alt').categories.slice(0,6) };
olderPayload.categories[0].questions[0] = fixture('Original').categories[0].questions[0];
const older = await createQuiz('Sechs Kategorien', olderPayload);
const originalSix = structuredClone(older.data.categories);
let expanded = older.data.categories;
for(let count=7;count<=10;count++) {
  expanded = repo.appendCategory(expanded);
  assert.equal(expanded.length,count);
  const loaded = await loadQuizData({kind:'custom',id:older.id});
  expanded[count-1].questions[0].answer = `Antwort ${count}`;
  await saveQuizData({kind:'custom',id:older.id},loaded,{...loaded.data,categories:expanded});
  const reloaded = await findQuiz(older.slug);
  assert.equal(reloaded.data.categories.length,count);
  assert.equal(reloaded.data.categories[count-1].questions[0].answer,`Antwort ${count}`);
  assert.deepEqual(reloaded.data.categories.slice(0,6),originalSix);
}
assert.equal(repo.appendCategory(expanded),expanded,'At ten, no content is removed or replaced');
assert.equal(repo.ensureCategoryCount(expanded,3),expanded,'Reducing round size keeps all saved questions');
assert.deepEqual((await findQuiz(fresh.slug)).data,fresh.data,'Other quiz remains unchanged');
const [a, b] = await Promise.all([createQuiz('Weihnachtsquiz 2026', fixture('A')), createQuiz('Weihnachtsquiz 2026', fixture('B'))]);
assert.notEqual(a.id, b.id); assert.deepEqual([a.slug, b.slug].sort(), ['weihnachtsquiz-2026', 'weihnachtsquiz-2026-2']);
const target = { kind: 'custom' as const, id: a.id };
const snapshot = await loadQuizData(target);
const edited = structuredClone(snapshot.data); edited.categories[0].questions[0].answer = 'Neue\nAntwort';
await saveQuizData(target, snapshot, edited);
assert.equal((await findQuiz(a.slug)).data.categories[0].questions[0].answer, 'Neue\nAntwort');
assert.deepEqual((await findQuiz(b.slug)).data, b.data);
await assert.rejects(saveQuizData(target, snapshot, fixture('Stale')), /inzwischen/);
await assert.rejects(saveQuizData({ kind: 'custom', id: b.id }, snapshot, edited), /Zuordnung/);
const current = await findQuiz(a.slug);
await renameQuiz(current, 'Neuer Name');
const renamed = await findQuiz(a.slug); assert.equal(renamed.title, 'Neuer Name'); assert.deepEqual(renamed.data.settings, { preserved: true });
const copy = await createQuiz('Kopie', renamed.data); assert.notEqual(copy.id, a.id); assert.deepEqual(copy.data.categories, renamed.data.categories);
await updateQuizInfo(renamed, { archived: true });
assert.equal((await findQuiz(a.slug)).archived, true);
assert.equal((await listQuizzes(false, 0, '')).rows.some(row => row.id === a.id), false);
assert.equal((await listQuizzes(true, 0, '')).rows[0].id, a.id);
await updateQuizInfo(await findQuiz(a.slug), { archived: false });
assert.equal((await findQuiz(a.slug)).archived, false);
await deleteQuiz(copy); await assert.rejects(findQuiz(copy.slug), /nicht gefunden/);
assert.equal((await findQuiz(a.slug)).id, a.id);
for (let i=0;i<26;i++) await createQuiz(`Seite ${i}`);
assert.equal((await listQuizzes(false, 0, 'Seite')).rows.length, 24);
assert.equal((await listQuizzes(false, 1, 'Seite')).rows.length, 2);
assert.equal(JSON.stringify([...legacy]), before, 'Existing quizzes must remain byte-identical');
assert.equal(requests.filter(r => r.table === 'quiz_data' && r.method !== 'GET').length, 0);
const bad = { id: crypto.randomUUID(), slug: 'kaputt', data: {}, revision: 1 }; custom.set(bad.id, bad);
const writes = requests.filter(r => r.method !== 'GET').length;
await assert.rejects(loadQuizData({ kind:'custom', id:bad.id }), /Format/);
await assert.rejects(findQuiz('unbekannt'), /nicht gefunden/);
assert.equal(requests.filter(r => r.method !== 'GET').length, writes, 'Loading invalid or missing data must never write defaults');
// A deliberate legacy edit in the fixture must target exactly Quiz 2.
const legacyOther = JSON.stringify([...legacy].filter(([id]) => id !== QUIZ_IDS[2]));
const quiz2 = await loadQuizData({ kind: 'legacy', slot: 2 });
await saveQuizData({ kind: 'legacy', slot: 2 }, quiz2, { ...quiz2.data, meta: { ...quiz2.data.meta, title: 'Bearbeitet' } });
assert.equal(JSON.stringify([...legacy].filter(([id]) => id !== QUIZ_IDS[2])), legacyOther);
assert.deepEqual(legacy.get(QUIZ_IDS[2]).data.categories, quiz2.data.categories);
console.log('PASS: legacy preservation; unique URLs; isolated save/reload; conflict protection; rename; duplicate; archive/restore; delete; pagination; read-only failures.');
