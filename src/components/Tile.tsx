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
  tabIndex?: number;
  dataKey?: string;
  style?: React.CSSProperties;
}

/**
 * A single board tile. Renders the Adinkra SVG, the symbol name, and all four
 * states (selected / hinted / free / blocked) without relying on colour alone
 * (design doc §12.3). Blocked tiles are `aria-disabled` rather than `disabled`
 * so a tap still reaches the engine and produces a "blocked" announcement.
 */
const Tile = memo(function Tile({
  tile,
  selected,
  hinted,
  free,
  onSelect,
  showName = true,
  tabIndex = -1,
  dataKey,
  style,
}: Props) {
  const symbol = SYMBOL_BY_ID[tile.symbolId];
  if (!symbol || tile.removed) return null;

  const svg = getSymbolSvg(symbol.svgAssetPath);

  const className = [
    'tile absolute flex flex-col items-center justify-center rounded-[10px] border-2 transition-all duration-150',
    'w-[54px] h-[72px] sm:w-[60px] sm:h-[80px]',
    selected
      ? 'border-gold-bright bg-tile-bg-2 shadow-[0_0_12px_rgba(201,146,43,0.4)] z-30 scale-105'
      : hinted
        ? 'border-accent-green bg-tile-bg-2 shadow-[0_0_8px_rgba(47,93,58,0.4)] z-20 animate-pulse-soft'
        : free
          ? 'border-gold/40 bg-tile-bg hover:border-gold/70 hover:shadow-md z-10'
          : 'border-ink-faint/20 bg-tile-bg opacity-60 z-0',
  ].join(' ');

  return (
    <button
      type="button"
      data-key={dataKey}
      tabIndex={tabIndex}
      onClick={() => onSelect(tile.key)}
      aria-pressed={selected}
      aria-disabled={!free}
      aria-label={symbol.accessibleLabel}
      className={className}
      style={{ position: 'absolute', ...style }}
    >
      <span
        className="pointer-events-none flex items-center justify-center text-gold"
        dangerouslySetInnerHTML={{
          __html: svg.replace(
            'viewBox="0 0 100 100"',
            'viewBox="0 0 100 100" class="w-8 h-8 sm:w-9 sm:h-9"',
          ),
        }}
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
