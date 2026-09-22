import { useMemo } from 'react';
import { freeKeys, liveTiles, maxLayerOf, occupiedFrom } from '../game/board';
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

export default function GameBoard({ state, layout, onSelect, showNames = true }: Props) {
  const occupied = useMemo(() => occupiedFrom(state.tiles), [state.tiles]);
  const free = useMemo(() => {
    const ml = maxLayerOf(state.tiles);
    return new Set(freeKeys(occupied, ml));
  }, [occupied, state.tiles]);

  const hintedSet = useMemo(() => {
    const s = new Set<TileKey>();
    if (state.hintKeys) {
      s.add(state.hintKeys[0]);
      s.add(state.hintKeys[1]);
    }
    return s;
  }, [state.hintKeys]);

  const tiles = useMemo(() => liveTiles(state.tiles), [state.tiles]);

  const boardWidth = layout.cols * TILE_W + layout.layers * LAYER_DX + 20;
  const boardHeight = layout.rows * TILE_H + layout.layers * LAYER_DY + 20;

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: boardWidth, height: boardHeight }}
      role="grid"
      aria-label="Mahjong board"
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
            onSelect={onSelect}
            showName={showNames}
            style={{
              left: x,
              top: y,
              zIndex: tile.layer * 100 + tile.y * 10 + tile.x,
            }}
          />
        );
      })}
    </div>
  );
}
