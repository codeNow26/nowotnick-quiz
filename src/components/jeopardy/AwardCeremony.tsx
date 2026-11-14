import { Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  players: { name: string; color: string; score: number }[];
  onDismiss: () => void;
}

export function AwardCeremony({players, onDismiss}: Props) {
  const standings = players.map((player, index) => ({...player, index})).sort((a,b) => b.score - a.score);
  const winners = standings.filter(player => player.score === standings[0].score);
  return <Dialog open onOpenChange={open => { if (!open) onDismiss(); }}>
    <DialogContent aria-describedby={undefined} className="quiz-podium isolate overflow-hidden rounded-3xl border-primary/30 p-6 md:p-8 max-h-[90dvh] overflow-y-auto">
      <Trophy aria-hidden="true" className="mx-auto size-10 text-amber-300" />
      <DialogTitle className="text-center font-display text-2xl">{winners.length === 1 ? `${winners[0].name} gewinnt!` : 'Gemeinsamer Sieg!'}</DialogTitle>
      <ol aria-label="Endstand" className="grid gap-2">
        {standings.map((player, i) => {
          const rank = standings.findIndex(other => other.score === player.score) + 1;
          return <li key={player.index} data-winner={rank === 1 || undefined} className="quiz-rank flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3" style={{'--rank-delay':`${i * 85}ms`} as CSSProperties}>
            <span className="font-display">{rank}.</span>
            <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{backgroundColor:player.color}} />
            <span className="min-w-0 flex-1 break-words">{player.name}</span>
            <strong className="tabular-nums">{player.score} Pkt.</strong>
          </li>;
        })}
      </ol>
      <Button onClick={onDismiss}>Siegerehrung überspringen</Button>
    </DialogContent>
  </Dialog>;
}
