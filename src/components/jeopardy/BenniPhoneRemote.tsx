import { useEffect, useState } from "react";
import { Clapperboard, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readTvGuest, requestTvClip, type TvGuestState } from "@/lib/bonus-pass-api";

/** One linked phone controls short TV inserts, except while players estimate. */
export function BenniPhoneRemote({ code }: { code: string }) {
  const [remote, setRemote] = useState<TvGuestState | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const fresh = await readTvGuest(code);
        if (!alive) return;
        setRemote(fresh);
        setError("");
        if (!fresh.busy) setNotice("");
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : "Benni-TV nicht erreichbar.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 2500);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [code]);

  const trigger = async (id: string) => {
    if (sending || remote?.busy) return;
    setSending(true);
    setError("");
    try {
      await requestTvClip(code, id);
      setRemote(previous => previous ? {...previous, busy: true, status: "pending"} : previous);
      setNotice("Clip wird auf dem großen Bildschirm gestartet.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Clip konnte nicht gestartet werden.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-3 border-t border-white/10 pt-5 text-left">
      <div className="flex items-center gap-2 text-[#e9dcff]">
        <Clapperboard className="h-5 w-5 text-[#b6a2f3]" />
        <h2 className="font-display text-lg">Benni-TV</h2>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-400/10 p-2 text-sm text-rose-200">{error}</p>}
      {remote && remote.clips.length ? (
        <div className="space-y-2">
          {remote.clips.map(clip => (
            <Button key={clip.id} type="button" variant="outline" disabled={sending || remote.busy}
              onClick={() => void trigger(clip.id)}
              className="flex h-auto min-h-12 w-full justify-start whitespace-normal rounded-xl border-white/15 py-3 text-left text-sm text-[#eee6ff] hover:bg-[#403267]">
              <Play className="mr-3 h-4 w-4 shrink-0 text-[#b7a6ef]" />
              {clip.title || "Benni-Moment"}
            </Button>
          ))}
          <Button type="button" disabled={sending || remote.busy}
            className="h-12 w-full rounded-xl font-display" onClick={() => void trigger("__random__")}>
            <Shuffle className="mr-2 h-4 w-4" /> Zufälliger Benni-Moment
          </Button>
          {remote.busy && <p role="status" className="text-center text-xs text-[#bcaed9]">Einspieler läuft auf dem Fernseher …</p>}
          {notice && <p role="status" className="text-center text-xs text-emerald-300">{notice}</p>}
        </div>
      ) : remote ? (
        <p className="text-xs text-[#b9aed2]">Noch keine Clips im Quiz hinterlegt. Du kannst sie im Quiz-Editor unter Benni-TV hochladen.</p>
      ) : !error ? (
        <p className="text-xs text-[#b9aed2]">Lade Benni-TV …</p>
      ) : null}
    </section>
  );
}
