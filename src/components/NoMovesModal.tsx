import Modal from './Modal';

interface Props {
  open: boolean;
  onRescue: () => void;
  onNewGame: () => void;
}

export default function NoMovesModal({ open, onRescue, onNewGame }: Props) {
  return (
    <Modal
      open={open}
      title="No Moves Left"
      actions={
        <>
          <button
            type="button"
            onClick={onRescue}
            className="rounded-lg bg-accent-green px-5 py-2 font-bold text-white hover:opacity-90"
          >
            Rescue Shuffle
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-lg border border-ink-faint/30 px-5 py-2 text-ink-soft hover:border-gold/50 hover:text-ink"
          >
            New Game
          </button>
        </>
      }
    >
      The board is stuck — no free matching pairs remain. Try a rescue shuffle or start fresh.
    </Modal>
  );
}
