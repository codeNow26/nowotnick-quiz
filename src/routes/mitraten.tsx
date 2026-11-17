import { useState, type FormEvent } from "react";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/mitraten")({ component: JoinBonusPage });

function JoinBonusPage() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const normalized = code.trim().toUpperCase().replace(/[^A-Z2-9]/g, "");
  const go = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalized.length !== 10) return;
    void navigate({ to: "/mitraten/$code", params: { code: normalized } });
  };
  // /mitraten/$code is a child route. The parent must render its Outlet,
  // otherwise navigating to a valid code leaves the join form on screen.
  if (pathname !== "/mitraten" && pathname !== "/mitraten/") return <Outlet />;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <form onSubmit={go} className="w-full max-w-sm space-y-5 rounded-3xl border border-primary/25 bg-[#17132f] p-6 text-center shadow-[0_20px_75px_rgba(0,0,0,.4)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15">
          <Smartphone className="h-7 w-7 text-[#baabff]" />
        </div>
        <h1 className="font-display text-2xl text-white">Alle schätzen!</h1>
        <p className="text-sm text-[#c4b9db]">Gib den Code ein, der auf dem Quizbildschirm steht. Eine App brauchst du nicht.</p>
        <label className="grid gap-2 text-left">
          <span className="text-xs font-medium text-[#c1b5d9]">Verbindungscode</span>
          <Input autoCapitalize="characters" autoComplete="off" spellCheck={false} inputMode="text" maxLength={12} value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXXXX" aria-label="10-stelliger Verbindungscode"
            className="h-14 rounded-xl border-white/20 bg-white/[.045] text-center font-mono text-xl tracking-[.15em] text-white" />
        </label>
        <Button type="submit" className="w-full rounded-xl py-6 font-display" disabled={normalized.length !== 10}>
          Verbinden <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}
