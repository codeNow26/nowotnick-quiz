/** Short, manually triggered video moments stored with the quiz payload. */
export interface BenniClip {
  id: string;
  title: string;
  url: string;
}

export const MAX_BENNI_CLIPS = 12;

export function readBenniClips(raw: unknown): BenniClip[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: BenniClip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, title, url } = item as Partial<BenniClip>;
    if (typeof id !== "string" || !id || seen.has(id) ||
        typeof title !== "string" ||
        typeof url !== "string" || !/^https:\/\//i.test(url)) continue;
    seen.add(id);
    // Preserve spaces while the user is typing a new title in the editor.
    result.push({ id, title: title.slice(0, 70), url });
    if (result.length >= MAX_BENNI_CLIPS) break;
  }
  return result;
}

export function titleForVideo(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 70) || "Benni-Moment";
}

/** Play each clip at most once per random cycle and never twice in succession. */
export function drawBenniClip(
  clips: BenniClip[],
  playedIds: string[],
  random = Math.random,
): { clip: BenniClip; playedIds: string[] } | null {
  if (!clips.length) return null;
  const validPlayed = [...new Set(playedIds)].filter(id => clips.some(clip => clip.id === id));
  const unseen = clips.filter(clip => !validPlayed.includes(clip.id));
  const lastId = validPlayed.at(-1);
  const pool = unseen.length
    ? unseen
    : clips.length > 1
      ? clips.filter(clip => clip.id !== lastId)
      : clips;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  const clip = pool[index];
  return { clip, playedIds: unseen.length ? [...validPlayed, clip.id] : [clip.id] };
}

export function recordBenniClip(playedIds: string[], clipId: string) {
  return [...playedIds.filter(id => id !== clipId), clipId];
}
