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
