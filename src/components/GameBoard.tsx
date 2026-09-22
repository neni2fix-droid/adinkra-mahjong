import { useEffect, useMemo, useRef, useState } from 'react';
import {
  findNearestInDirection,
  freeKeys,
  liveTiles,
  maxLayerOf,
  occupiedFrom,
} from '../game/board';
import type { Direction } from '../game/board';
import type { GameState, LayoutDefinition, TileKey } from '../game/types';
import Tile from './Tile';

interface Props {
  state: GameState;
  layout: LayoutDefinition;
  onSelect: (key: TileKey) => void;
  showNames?: boolean;
}

const TILE_W = 56;
const TILE_H = 74;
const LAYER_DX = 8;
const LAYER_DY = 6;

/**
 * The positioned, layered board.
 *
 * Two concerns live here:
 *  - **Responsive scaling** — the board has a fixed pixel footprint; we measure
 *    the available width and `transform: scale()` it down so the whole board is
 *    always visible on phones without tiny tap targets.
 *  - **Keyboard navigation** — arrow keys move a logical focus among the *free*
 *    tiles via `findNearestInDirection`; Enter/Space selects. The focused tile is
 *    focused in the DOM via a `data-key` lookup so keyboard and screen-reader
 *    players steer identically to mouse players (architecture §12.2).
 */
export default function GameBoard({ state, layout, onSelect, showNames = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [focusedKey, setFocusedKey] = useState<TileKey>('');

  const occupied = useMemo(() => occupiedFrom(state.tiles), [state.tiles]);
  const maxLayer = maxLayerOf(state.tiles);
  const free = useMemo(() => new Set(freeKeys(occupied, maxLayer)), [occupied, maxLayer]);
  const tiles = useMemo(() => liveTiles(state.tiles), [state.tiles]);

  const hintedSet = useMemo(() => {
    const s = new Set<TileKey>();
    if (state.hintKeys) {
      s.add(state.hintKeys[0]);
      s.add(state.hintKeys[1]);
    }
    return s;
  }, [state.hintKeys]);

  const boardWidth = layout.cols * TILE_W + layout.layers * LAYER_DX + 20;
  const boardHeight = layout.rows * TILE_H + layout.layers * LAYER_DY + 20;

  // Scale the fixed footprint to fit the viewport width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / boardWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [boardWidth]);

  // Keep the logical focus on a free tile; when it leaves the board, snap to the
  // next available free tile so keyboard focus never gets stranded.
  useEffect(() => {
    if (focusedKey && free.has(focusedKey)) return;
    const first = tiles.find((t) => free.has(t.key))?.key ?? '';
    setFocusedKey(first);
  }, [free, tiles, focusedKey]);

  // Mirror the logical focus into the DOM.
  useEffect(() => {
    if (!focusedKey) return;
    containerRef.current
      ?.querySelector<HTMLButtonElement>(`[data-key="${focusedKey}"]`)
      ?.focus();
  }, [focusedKey]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const dir = ARROW_KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    if (!focusedKey) {
      setFocusedKey(tiles.find((t) => free.has(t.key))?.key ?? '');
      return;
    }
    const next = findNearestInDirection(occupied, focusedKey, dir as Direction, maxLayer);
    if (next) setFocusedKey(next);
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full justify-center"
      style={{ height: boardHeight * scale }}
      onKeyDown={handleKeyDown}
    >
      <div
        role="grid"
        aria-label="Mahjong board"
        className="relative select-none"
        style={{
          width: boardWidth,
          height: boardHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {tiles.map((tile) => {
          const isFree = free.has(tile.key);
          const isSelected = state.selected === tile.key;
          const isHinted = hintedSet.has(tile.key);
          const x = tile.x * TILE_W + tile.layer * LAYER_DX + 10;
          const y = tile.y * TILE_H + tile.layer * LAYER_DY + 10;

          return (
            <Tile
              key={tile.key}
              tile={tile}
              selected={isSelected}
              hinted={isHinted}
              free={isFree}
              showName={showNames}
              onSelect={onSelect}
              tabIndex={focusedKey === tile.key ? 0 : -1}
              dataKey={tile.key}
              data-focused={focusedKey === tile.key}
              style={{
                left: x,
                top: y,
                zIndex: tile.layer * 100 + tile.y * 10 + tile.x,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
