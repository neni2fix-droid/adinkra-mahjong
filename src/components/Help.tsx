import { SYMBOLS } from '../data/symbols';
import { FAMILY_LABELS } from '../data/symbols';
import { getSymbolSvg } from '../data/svg-registry';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Help({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      title="How to Play"
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gold px-5 py-2 font-bold text-parchment hover:bg-gold-bright"
        >
          Got it
        </button>
      }
    >
      <div className="space-y-4 text-sm text-ink-soft">
        <p>
          <strong className="text-ink">Find matching symbols.</strong> Click a free tile to select it, then click another free tile with the same symbol to match and remove the pair.
        </p>
        <p>
          <strong className="text-ink">A tile must be free</strong> — not covered by any tile above it, and open on at least one horizontal side.
        </p>
        <p>
          <strong className="text-ink">Clear the board</strong> by removing all 136 tiles to win. Use <strong>Hint</strong> or <strong>Shuffle</strong> strategically when stuck.
        </p>
        <div className="border-t border-ink-faint/20 pt-3">
          <h3 className="mb-2 font-bold text-ink">The 34 Adinkra Symbols</h3>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {SYMBOLS.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-ink-faint/10 bg-parchment p-2"
              >
                <span
                  className="h-8 w-8 flex-shrink-0 text-gold"
                  dangerouslySetInnerHTML={{
                    __html: getSymbolSvg(s.svgAssetPath).replace(
                      'viewBox="0 0 100 100"',
                      'viewBox="0 0 100 100" class="w-6 h-6"',
                    ),
                  }}
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-ink">{s.name}</div>
                  <div className="truncate text-[10px] text-ink-faint">
                    {FAMILY_LABELS[s.family]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
