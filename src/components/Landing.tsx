import { SYMBOLS } from '../data/symbols';
import { getSymbolSvg } from '../data/svg-registry';

interface Props {
  onPlay: () => void;
}

export default function Landing({ onPlay }: Props) {
  const previewSymbols = SYMBOLS.slice(0, 6);

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex gap-3">
        {previewSymbols.map((s) => (
          <div
            key={s.id}
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-gold/30 bg-tile-bg text-gold shadow-lg sm:h-16 sm:w-16"
            dangerouslySetInnerHTML={{
              __html: getSymbolSvg(s.svgAssetPath).replace(
                'viewBox="0 0 100 100"',
                'viewBox="0 0 100 100" class="w-8 h-8"',
              ),
            }}
          />
        ))}
      </div>

      <div>
        <h1 className="font-display text-5xl font-bold text-ink sm:text-6xl">
          <span className="text-accent-red">Adinkra</span> Mahjong
        </h1>
        <p className="mt-3 max-w-md text-lg text-ink-soft">
          A Ghanaian-inspired game of memory, pattern and strategy.
        </p>
      </div>

      <button
        type="button"
        onClick={onPlay}
        className="rounded-xl bg-gold px-10 py-3 text-lg font-bold text-parchment shadow-lg transition-transform hover:scale-105 hover:bg-gold-bright active:scale-95"
      >
        Play
      </button>

      <p className="max-w-sm text-sm text-ink-faint">
        Match two <em>free</em> tiles bearing the same Adinkra symbol.
        Clear all 136 tiles to win.
      </p>

      <footer className="mt-8 text-xs text-ink-faint">
        Inspired by Ghana&rsquo;s Adinkra visual tradition.
        <br />
        Design & Engineering: Nenifix
      </footer>
    </div>
  );
}
