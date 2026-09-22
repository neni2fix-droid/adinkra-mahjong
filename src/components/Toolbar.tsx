import { canHint, canShuffle, canUndo } from '../game/state';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onPause: () => void;
  onHelp: () => void;
  onSettings: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export default function Toolbar({
  state,
  onNewGame,
  onUndo,
  onHint,
  onShuffle,
  onPause,
  onHelp,
  onSettings,
  soundMuted,
  onToggleSound,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2">
      <ToolBtn onClick={onNewGame} label="New" />
      <ToolBtn onClick={onUndo} label="Undo" disabled={!canUndo(state)} />
      <ToolBtn onClick={onHint} label={`Hint (${state.score.charms})`} disabled={!canHint(state)} />
      <ToolBtn onClick={onShuffle} label={`Shuffle (${state.score.charms})`} disabled={!canShuffle(state)} />
      <ToolBtn onClick={onPause} label="Pause" />
      <ToolBtn onClick={onHelp} label="?" title="How to Play" />
      <ToolBtn onClick={onSettings} label="⚙" title="Settings" />
      <ToolBtn onClick={onToggleSound} label={soundMuted ? '🔇' : '🔊'} title="Toggle sound" />
      <ToolBtn onClick={onToggleTheme} label={theme === 'dark' ? '🌙' : '☀️'} title="Toggle theme" />
    </div>
  );
}

function ToolBtn({
  onClick,
  label,
  disabled,
  title,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        disabled
          ? 'border-ink-faint/10 bg-parchment-3/50 text-ink-faint cursor-not-allowed'
          : 'border-ink-faint/20 bg-parchment-2 text-ink-soft hover:border-gold/50 hover:text-ink',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
