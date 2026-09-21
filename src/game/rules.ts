/**
 * Rules — matching, move detection and the selection state machine.
 *
 * These functions are the **authority on legality**. Nothing else in the app may
 * decide whether a move is legal; the UI only renders what these report.
 *
 * Pure module: no DOM, no React, no randomness.
 */
import {
  countBySymbol,
  freeKeys,
  isFreeKey,
  liveTiles,
  occupiedFrom,
  parseKey,
} from './board';
import type { LayerIndex, SymbolId, Tile, TileKey } from './types';

/** A matched pair of tile keys. */
export type TilePair = [TileKey, TileKey];

/**
 * Every legal match currently on the board.
 *
 * A pair is legal when **both** tiles are free (see `board.ts`) and share a
 * symbol id. Results are deterministic: symbols ascend, and within a symbol the
 * pairs follow `(layer, y, x)` order.
 */
export function findAllMatches(
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
): TilePair[] {
  const occupied = occupiedFrom(tiles);
  const free = freeKeys(occupied, maxLayer);

  const bySymbol = new Map<SymbolId, TileKey[]>();
  for (const k of free) {
    const list = bySymbol.get(tiles[k].symbolId);
    if (list) list.push(k);
    else bySymbol.set(tiles[k].symbolId, [k]);
  }

  const pairs: TilePair[] = [];
  for (const symbolId of [...bySymbol.keys()].sort((a, b) => a - b)) {
    const group = bySymbol.get(symbolId)!;
    for (let i = 0; i < group.length - 1; i++) {
      pairs.push([group[i], group[i + 1]]);
    }
  }
  return pairs;
}

/** The first legal match, or `null` when the board is stuck. */
export function findMatch(
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
): TilePair | null {
  return findAllMatches(tiles, maxLayer)[0] ?? null;
}

/** Is at least one legal match available? */
export function hasMoves(tiles: Record<TileKey, Tile>, maxLayer: LayerIndex): boolean {
  return findMatch(tiles, maxLayer) !== null;
}

/**
 * The *smartest* legal match — what the Hint button should show.
 *
 * Preference order, best first:
 *   1. **Quad-clearing** — the symbol has exactly 2 live copies, so this match
 *      completes it and pays the +200 Quad Clear bonus and a Charm. This teaches
 *      the core strategy (design doc §4.2) rather than merely unsticking the
 *      player.
 *   2. **Highest tiles** — the pair whose tiles sit on the highest layers, since
 *      clearing the top of the board is what unlocks everything below it.
 *   3. Deterministic key order.
 *
 * Never returns a blocked or non-matching pair: candidates come from
 * {@link findAllMatches}, which only ever yields free, symbol-identical pairs.
 */
export function findHint(
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
): TilePair | null {
  const matches = findAllMatches(tiles, maxLayer);
  if (matches.length === 0) return null;

  const counts = countBySymbol(tiles);

  let best: TilePair | null = null;
  let bestRank = -1;
  let bestHeight = -1;

  for (const pair of matches) {
    const symbolId = tiles[pair[0]].symbolId;
    const quadClearing = counts.get(symbolId) === 2;
    const height = parseKey(pair[0]).layer + parseKey(pair[1]).layer;
    const rank = quadClearing ? 1 : 0;

    if (rank > bestRank || (rank === bestRank && height > bestHeight)) {
      best = pair;
      bestRank = rank;
      bestHeight = height;
    }
  }

  return best;
}

/** Everything `select` can report. Mirrors `SelectResult` in `types.ts`. */
export type SelectOutcome =
  | { type: 'ignored' }
  | { type: 'blocked'; key: TileKey }
  | { type: 'selected'; key: TileKey }
  | { type: 'deselected'; key: TileKey }
  | { type: 'invalid'; first: TileKey; second: TileKey }
  | { type: 'matched'; keys: TilePair; symbolId: SymbolId };

/**
 * The selection state machine.
 *
 * ```
 * tap dead tile   → ignored
 * tap blocked tile→ blocked      (no state change; the UI shakes + announces)
 * tap selected    → deselected
 * tap with none   → selected
 * tap same symbol → matched
 * tap other symbol→ invalid      (Flow streak breaks; new tile becomes selected)
 * ```
 *
 * This function performs no mutation and applies no scoring — it only classifies
 * the input. `state.ts` owns the consequences.
 *
 * @param tiles    Current tile record.
 * @param selected The currently selected key, or `null`.
 * @param key      The tapped key.
 * @param maxLayer Highest layer index.
 */
export function select(
  tiles: Record<TileKey, Tile>,
  selected: TileKey | null,
  key: TileKey,
  maxLayer: LayerIndex,
): SelectOutcome {
  const tile = tiles[key];
  if (!tile || tile.removed) return { type: 'ignored' };

  const occupied = occupiedFrom(tiles);
  if (!isFreeKey(occupied, key, maxLayer)) return { type: 'blocked', key };

  if (selected === key) return { type: 'deselected', key };
  if (selected === null) return { type: 'selected', key };

  const first = tiles[selected];
  // A stale selection (the tile vanished under us) degrades to a fresh select
  // rather than reporting a bogus match.
  if (!first || first.removed) return { type: 'selected', key };

  if (first.symbolId === tile.symbolId) {
    return { type: 'matched', keys: [selected, key], symbolId: tile.symbolId };
  }
  return { type: 'invalid', first: selected, second: key };
}

/** Live tiles as a lookup, for callers that need symbols by key. */
export function tilesByKey(tiles: Record<TileKey, Tile>): Map<TileKey, Tile> {
  const map = new Map<TileKey, Tile>();
  for (const t of liveTiles(tiles)) map.set(t.key, t);
  return map;
}
