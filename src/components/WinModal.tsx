import Modal from './Modal';

interface Props {
  open: boolean;
  score: number;
  timeSeconds: number;
  stars: number;
  onPlayAgain: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WinModal({ open, score, timeSeconds, stars, onPlayAgain }: Props) {
  return (
    <Modal
      open={open}
      title="Well done!"
      actions={
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-lg bg-gold px-6 py-2 font-bold text-parchment hover:bg-gold-bright"
        >
          Play Again
        </button>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-3xl tracking-widest text-gold">
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-center">
          <div className="text-sm text-ink-faint">Score</div>
          <div className="text-sm text-ink-faint">Time</div>
          <div className="text-xl font-bold text-ink">{score.toLocaleString()}</div>
          <div className="text-xl font-bold text-ink">{formatTime(timeSeconds)}</div>
        </div>
      </div>
    </Modal>
  );
}
