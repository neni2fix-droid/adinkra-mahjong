import Modal from './Modal';

interface Props {
  open: boolean;
  onResume: () => void;
  onNewGame: () => void;
}

export default function PauseOverlay({ open, onResume, onNewGame }: Props) {
  return (
    <Modal
      open={open}
      title="Paused"
      onClose={onResume}
      actions={
        <>
          <button
            type="button"
            onClick={onResume}
            className="rounded-lg bg-gold px-5 py-2 font-bold text-parchment hover:bg-gold-bright"
          >
            Resume
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
      Take a breath. The board will be here when you return.
    </Modal>
  );
}
