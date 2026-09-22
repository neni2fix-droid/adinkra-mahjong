import { memo } from 'react';
import { SYMBOL_BY_ID } from '../data/symbols';
import { getSymbolSvg } from '../data/svg-registry';
import type { Tile as TileType, TileKey } from '../game/types';

interface Props {
  tile: TileType;
  selected: boolean;
  hinted: boolean;
  free: boolean;
  onSelect: (key: TileKey) => void;
  showName?: boolean;
  style?: React.CSSProperties;
}

const Tile = memo(function Tile({ tile, selected, hinted, free, onSelect, showName = true, style }: Props) {
  const symbol = SYMBOL_BY_ID[tile.symbolId];
  if (!symbol || tile.removed) return null;

  const svg = getSymbolSvg(symbol.svgAssetPath);

  return (
    <button
      type="button"
      onClick={() => onSelect(tile.key)}
      disabled={!free}
      aria-pressed={selected}
      aria-label={symbol.accessibleLabel}
      className={[
        'tile absolute flex flex-col items-center justify-center rounded-[10px] border-2 transition-all duration-150',
        'w-[54px] h-[72px] sm:w-[60px] sm:h-[80px]',
        selected
          ? 'border-gold-bright bg-tile-bg-2 shadow-[0_0_12px_rgba(201,146,43,0.4)] z-30 scale-105'
          : hinted
            ? 'border-accent-green bg-tile-bg-2 shadow-[0_0_8px_rgba(47,93,58,0.4)] z-20'
            : free
              ? 'border-gold/40 bg-tile-bg hover:border-gold/70 hover:shadow-md z-10'
              : 'border-ink-faint/20 bg-tile-bg opacity-60 z-0',
      ].join(' ')}
      style={style}
    >
      <span
        className="pointer-events-none flex items-center justify-center text-gold"
        dangerouslySetInnerHTML={{ __html: svg.replace('viewBox="0 0 100 100"', 'viewBox="0 0 100 100" class="w-8 h-8 sm:w-9 sm:h-9"') }}
      />
      {showName && (
        <span className="mt-0.5 max-w-full truncate px-1 text-[8px] font-medium text-gold/70 sm:text-[9px]">
          {symbol.name}
        </span>
      )}
    </button>
  );
});

export default Tile;
