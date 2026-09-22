import { LAYOUTS } from '../data/layouts';
import type { LayoutId } from '../game/types';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  layoutId: LayoutId;
  onChangeLayout: (id: LayoutId) => void;
  reduceMotion: boolean;
  onChangeMotion: (v: boolean) => void;
}

export default function SettingsPanel({ open, onClose, layoutId, onChangeLayout, reduceMotion, onChangeMotion }: Props) {
  return (
    <Modal
      open={open}
      title="Settings"
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gold px-5 py-2 font-bold text-parchment hover:bg-gold-bright"
        >
          Done
        </button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Board Layout</label>
          <div className="space-y-1">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onChangeLayout(l.id)}
                className={[
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  layoutId === l.id
                    ? 'border-gold bg-gold/10 text-ink'
                    : 'border-ink-faint/10 text-ink-soft hover:border-gold/30',
                ].join(' ')}
              >
                <span>{l.name}</span>
                <span className="text-xs text-ink-faint">{l.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => onChangeMotion(e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <span className="text-sm text-ink-soft">Reduce motion</span>
        </label>
      </div>
    </Modal>
  );
}
