import { supabase } from './supabase';

export const VIDEO_BUCKET = 'quiz-videos';
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export function validateVideo(file: Pick<File, 'type' | 'size'>) {
  if (!['video/mp4', 'video/webm'].includes(file.type)) throw new Error('Bitte eine MP4- oder WebM-Datei auswählen.');
  if (!file.size || file.size > MAX_VIDEO_BYTES) throw new Error('Das Video muss zwischen 1 Byte und 50 MB groß sein.');
}
export async function uploadQuizVideo(quizId: string, file: File): Promise<string> {
  validateVideo(file);
  if (!/^[a-zA-Z0-9-]+$/.test(quizId)) throw new Error('Das Quiz konnte nicht eindeutig zugeordnet werden.');
  const path = `${quizId}/${crypto.randomUUID()}.${file.type === 'video/mp4' ? 'mp4' : 'webm'}`;
  const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) throw new Error(`Video-Upload fehlgeschlagen. Bitte Verbindung prüfen. Falls der Videospeicher noch nicht eingerichtet ist, zuerst das mitgelieferte SQL-Skript ausführen. (${error.message})`);
  return supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
}


// Audio uses the same public media bucket as videos. Audio uploads require
// the additive 20261117_quiz_audio.sql migration to allow audio MIME types.
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const AUDIO_TYPES = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/webm": "webm",
} as const;

export function validateAudio(file: Pick<File, "name" | "type" | "size">): { contentType: string; ext: string } {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const byExtension: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    webm: "audio/webm",
  };
  const byMime = AUDIO_TYPES[file.type as keyof typeof AUDIO_TYPES];
  const contentType = byMime ? (byExtension[extension] ?? file.type) : (!file.type ? byExtension[extension] : undefined);
  if (!contentType || !byExtension[extension]) {
    throw new Error("Bitte MP3, WAV, OGG, M4A oder WebM-Audio auswählen.");
  }
  if (!file.size || file.size > MAX_AUDIO_BYTES) {
    throw new Error("Die Audiodatei darf maximal 20 MB groß sein.");
  }
  return { contentType: byExtension[extension], ext: extension };
}

export async function uploadQuizAudio(quizId: string, file: File): Promise<string> {
  const { contentType, ext } = validateAudio(file);
  if (!/^[a-zA-Z0-9-]+$/.test(quizId)) {
    throw new Error("Das Quiz konnte nicht eindeutig zugeordnet werden.");
  }
  const path = `${quizId}/audio-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, file, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    throw new Error(`Audio-Upload fehlgeschlagen: ${error.message}. Prüfe bitte, ob die zusätzliche Audio-Speicher-Migration bereits ausgeführt wurde.`);
  }
  return supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
}
