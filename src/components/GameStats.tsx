import { isFlowAlive } from '../game/scoring';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameStats({ state }: Props) {
  const { score, remaining, elapsedSeconds } = state;

  // Recomputed every render (the timer re-renders this component once a second
  // while playing), so the Flow indicator lapses exactly when the window does.
  const flowActive = isFlowAlive(score, Date.now());

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm">
      <Stat label="Score" value={score.score.toLocaleString()} />
      <Stat label="Time" value={formatTime(elapsedSeconds)} />
      <Stat label="Tiles" value={`${remaining}`} />
      <Stat
        label="Combo"
        value={flowActive ? `×${score.combo}` : '×1'}
        highlight={flowActive}
      />
      <Stat label="Charms" value={`${score.charms}`} icon="✦" />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-full border px-3 py-1',
        highlight
          ? 'border-gold bg-gold/10 text-gold'
          : 'border-ink-faint/20 text-ink-soft',
      ].join(' ')}
    >
      <span className="text-xs opacity-70">{label}</span>
      <span className="font-semibold">
        {icon}
        {value}
      </span>
    </div>
  );
}
