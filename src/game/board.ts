/**
 * Board geometry — tile keys, occupancy and the **freedom rule**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FREEDOM RULE (the heart of Mahjong Solitaire)
 *
 * A tile may be selected only when it is:
 *   1. **Not covered** — no live tile sits directly above it on a higher layer;
 *   2. **Open on a side** — its left *or* right neighbour on the same layer is
 *      empty.
 *
 * Both conditions are exact here because every layout places tiles on an integer
 * grid with no half-tile offsets (see `data/layouts.ts`), so "covered" means
 * precisely "a live tile shares my `(x, y)` on a higher layer".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pure module: no DOM, no React, no randomness.
 */
import type { BoardPosition, LayerIndex, SymbolId, Tile, TileKey } from './types';

/** Compose a tile key. Keys are `` `${layer}:${x}:${y}` ``. */
export function key(x: number, y: number, layer: LayerIndex): TileKey {
  return `${layer}:${x}:${y}`;
}

/**
 * Parse a tile key back into a position.
 *
 * @throws If the key is not in `layer:x:y` form.
 */
export function parseKey(tileKey: TileKey): BoardPosition {
  const parts = tileKey.split(':');
  if (parts.length !== 3) {
    throw new Error(`[adinkra] malformed tile key "${tileKey}" (expected "layer:x:y").`);
  }
  const layer = Number(parts[0]);
  const x = Number(parts[1]);
  const y = Number(parts[2]);
  if (!Number.isFinite(layer) || !Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`[adinkra] malformed tile key "${tileKey}" (non-numeric component).`);
  }
  return { x, y, layer };
}

/** Materialise a tile record for every position in a layout, un-dealt. */
export function emptyTiles(positions: readonly BoardPosition[]): Record<TileKey, Tile> {
  const tiles: Record<TileKey, Tile> = {};
  for (const p of positions) {
    const k = key(p.x, p.y, p.layer);
    tiles[k] = { key: k, x: p.x, y: p.y, layer: p.layer, symbolId: 0, removed: false };
  }
  return tiles;
}

/** The set of keys still on the board — the "occupancy" the rules read. */
export function occupiedFrom(tiles: Record<TileKey, Tile>): Set<TileKey> {
  const occupied = new Set<TileKey>();
  for (const k in tiles) {
    if (!tiles[k].removed) occupied.add(k);
  }
  return occupied;
}

/** All live tiles, in ascending `(layer, y, x)` order (deterministic). */
export function liveTiles(tiles: Record<TileKey, Tile>): Tile[] {
  const live: Tile[] = [];
  for (const k in tiles) {
    if (!tiles[k].removed) live.push(tiles[k]);
  }
  return live.sort(compareTiles);
}

/** All live keys, in ascending `(layer, y, x)` order. */
export function liveKeys(tiles: Record<TileKey, Tile>): TileKey[] {
  return liveTiles(tiles).map((t) => t.key);
}

/** Deterministic tile ordering: bottom layer first, then top-to-bottom, left-to-right. */
export function compareTiles(a: BoardPosition, b: BoardPosition): number {
  if (a.layer !== b.layer) return a.layer - b.layer;
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

/** How many tiles remain on the board. */
export function remainingCount(tiles: Record<TileKey, Tile>): number {
  let n = 0;
  for (const k in tiles) {
    if (!tiles[k].removed) n++;
  }
  return n;
}

/** Live-tile count per symbol. Symbols with zero live copies are omitted. */
export function countBySymbol(tiles: Record<TileKey, Tile>): Map<SymbolId, number> {
  const counts = new Map<SymbolId, number>();
  for (const k in tiles) {
    const t = tiles[k];
    if (t.removed) continue;
    counts.set(t.symbolId, (counts.get(t.symbolId) ?? 0) + 1);
  }
  return counts;
}

/** The highest layer index present in a tile record. */
export function maxLayerOf(tiles: Record<TileKey, Tile>): LayerIndex {
  let max = 0;
  for (const k in tiles) {
    if (tiles[k].layer > max) max = tiles[k].layer;
  }
  return max;
}

/**
 * Is the tile at `(x, y, layer)` free? See THE FREEDOM RULE above.
 *
 * @param occupied Live-key set from {@link occupiedFrom}.
 * @param maxLayer Highest layer index, so the "covered" scan is bounded.
 * @returns `false` when the tile is absent, covered, or sandwiched on both sides.
 */
export function isFree(
  occupied: ReadonlySet<TileKey>,
  x: number,
  y: number,
  layer: LayerIndex,
  maxLayer: LayerIndex,
): boolean {
  if (!occupied.has(key(x, y, layer))) return false;

  // 1. covered from above?
  for (let l = layer + 1; l <= maxLayer; l++) {
    if (occupied.has(key(x, y, l))) return false;
  }

  // 2. at least one horizontal side open?
  const leftOpen = !occupied.has(key(x - 1, y, layer));
  const rightOpen = !occupied.has(key(x + 1, y, layer));
  return leftOpen || rightOpen;
}

/** {@link isFree} for a key rather than a coordinate. */
export function isFreeKey(
  occupied: ReadonlySet<TileKey>,
  tileKey: TileKey,
  maxLayer: LayerIndex,
): boolean {
  const { x, y, layer } = parseKey(tileKey);
  return isFree(occupied, x, y, layer, maxLayer);
}

/**
 * Every free key, in deterministic `(layer, y, x)` order.
 *
 * @param occupied Live-key set.
 * @param maxLayer Highest layer index.
 */
export function freeKeys(
  occupied: ReadonlySet<TileKey>,
  maxLayer: LayerIndex,
): TileKey[] {
  const free: TileKey[] = [];
  for (const k of occupied) {
    if (isFreeKey(occupied, k, maxLayer)) free.push(k);
  }
  return free.sort(compareKeys);
}

/** Sort tile keys deterministically by `(layer, y, x)`. */
export function compareKeys(a: TileKey, b: TileKey): number {
  return compareTiles(parseKey(a), parseKey(b));
}

/** An 8-way compass direction, for keyboard navigation. */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Nearest free tile in a compass direction — the keyboard navigation primitive.
 *
 * Candidates are the free tiles whose centre lies in the half-plane of the
 * direction. Each is scored by squared distance with a **same-layer bonus**, so
 * moving sideways on a stack does not jump the focus to a distant layer. Ties
 * break on `(layer, y, x)` for determinism.
 *
 * @returns The winning key, or `null` when nothing lies in that direction.
 */
export function findNearestInDirection(
  occupied: ReadonlySet<TileKey>,
  from: TileKey,
  direction: Direction,
  maxLayer: LayerIndex,
): TileKey | null {
  const origin = parseKey(from);
  let best: TileKey | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of freeKeys(occupied, maxLayer)) {
    if (candidate === from) continue;
    const p = parseKey(candidate);

    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const inPlane =
      direction === 'left' ? dx < 0
      : direction === 'right' ? dx > 0
      : direction === 'up' ? dy < 0
      : dy > 0;
    if (!inPlane) continue;

    // Primary axis counts for less than the off-axis drift, so focus stays
    // roughly on the row/column the player is travelling along.
    const primary =
      direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary =
      direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const sameLayer = p.layer === origin.layer ? 0 : 1;

    const score = sameLayer * 1000 + secondary * 10 + primary;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}
