import { useEffect, useRef, useState } from "react";
import { Clapperboard, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { readTvGuest, requestTvClip, type TvGuestState } from "@/lib/bonus-pass-api";

/** One linked phone controls short TV inserts, except while players estimate. */
export function BenniPhoneRemote({ code }: { code: string }) {
  const [remote, setRemote] = useState<TvGuestState | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [notice, setNotice] = useState("");
  const pendingSince = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // The broadcast is a wake-up only. The durable command stays in the database.
    const channel = supabase.channel(`benni-tv:${code}`).subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current === channel) channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [code]);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const fresh = await readTvGuest(code);
        if (!alive) return;
        setRemote(fresh);
        setConnectionError("");
        if (!fresh.busy) {
          pendingSince.current = null;
          setNotice("");
        } else if (fresh.status === "playing") {
          pendingSince.current = null;
          setNotice("Der Quizbildschirm hat den Einspieler angenommen.");
        } else if (fresh.status === "pending") {
          pendingSince.current ??= Date.now();
          setNotice(!fresh.hostOnline
            ? "Verbindung zum Quizbildschirm unterbrochen. Öffne das Quiz auf dem Laptop und kopple bei Bedarf neu."
            : Date.now() - pendingSince.current > 8000
              ? "Die Anfrage wartet noch auf die Wiedergabe. Prüfe, ob auf dem Quizbildschirm ein anderes Fenster offen ist."
              : "Anfrage gesendet. Warte auf den Quizbildschirm …");
        }
      } catch (cause) {
        if (alive) setConnectionError(cause instanceof Error ? cause.message : "Benni-TV nicht erreichbar.");
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
    if (sending || remote?.busy || !remote?.hostOnline) return;
    setSending(true);
    setError("");
    try {
      await requestTvClip(code, id);
      // A failed Realtime signal is harmless: the host still polls the RPC.
      void channelRef.current?.send({
        type: "broadcast", event: "request", payload: {},
      }).catch(error => console.warn("Benni-TV Realtime-Wake-up:", error));
      pendingSince.current = Date.now();
      setRemote(previous => previous ? {...previous, busy: true, status: "pending"} : previous);
      setNotice("Anfrage gesendet. Warte auf den Quizbildschirm …");
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
      {(error || connectionError) && <p role="alert" className="rounded-xl bg-rose-400/10 p-2 text-sm text-rose-200">{error || connectionError}</p>}
      {remote && (
        <p role="status" className={`rounded-xl border px-3 py-2 text-xs ${remote.hostOnline
          ? "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200"
          : "border-amber-400/20 bg-amber-400/[.07] text-amber-200"}`}>
          {remote.hostOnline
            ? "Quizbildschirm verbunden. Benni-TV ist bereit."
            : "Quizbildschirm nicht erreichbar. Öffne das Quiz auf dem Laptop oder verbinde das Handy über den aktuellen QR-Code neu."}
        </p>
      )}
      {remote && remote.clips.length ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {remote.clips.map(clip => (
              <Button key={clip.id} type="button" variant="outline" disabled={sending || remote.busy || !remote.hostOnline}
                aria-label={`${clip.title || "Benni-Moment"} auf dem Quizbildschirm abspielen`}
                onClick={() => void trigger(clip.id)}
                className="flex h-auto min-h-[94px] min-w-0 flex-col items-center justify-center gap-2 whitespace-normal rounded-2xl border-white/15 bg-white/[.04] px-2 py-3 text-center text-sm text-[#eee6ff] shadow-sm transition-colors hover:border-primary/50 hover:bg-[#403267] disabled:opacity-50">
                <Play className="h-5 w-5 shrink-0 text-[#b7a6ef]" aria-hidden="true" />
                <span className="line-clamp-2 w-full break-words text-center text-xs font-semibold leading-snug">
                  {clip.title || "Benni-Moment"}
                </span>
              </Button>
            ))}
          </div>
          <Button type="button" disabled={sending || remote.busy || !remote.hostOnline}
            className="h-12 w-full rounded-xl font-display" onClick={() => void trigger("__random__")}>
            <Shuffle className="mr-2 h-4 w-4" /> Zufälliger Benni-Moment
          </Button>
          {notice && <p role="status" className="text-center text-xs text-[#bcaed9]">{notice}</p>}
        </div>
      ) : remote ? (
        <p className="text-xs text-[#b9aed2]">Noch keine Benni-TV-Clips vorhanden. Du kannst sie im Quiz-Editor hochladen.</p>
      ) : !error ? (
        <p className="text-xs text-[#b9aed2]">Lade Benni-TV …</p>
      ) : null}
    </section>
  );
}
