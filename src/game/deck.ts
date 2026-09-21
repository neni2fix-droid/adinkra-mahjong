/**
 * Deck — deterministic RNG, solvable deal generation, and shuffle-with-solvability.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CORE GUARANTEE (design doc §7)
 *
 * Boards are never *shuffled and hoped for*. They are built by **reverse play**:
 * start from an empty board, repeatedly remove a legal pair, and record the
 * order. Because every removal was legal at the moment it happened, the recorded
 * order *is* a valid solution — so a solvable deal is a mathematical certainty,
 * not a probability.
 *
 * The same routine powers Shuffle, which is why a shuffle can promise both "all
 * tiles preserved" and "at least one legal move exists" at the same time.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pure module: no DOM, no React, no `Math.random` (every entry point takes a
 * seed, so runs are reproducible and testable).
 */
import { compareKeys, isFreeKey, key, occupiedFrom, parseKey } from './board';
import { findAllMatches } from './rules';
import { SHUFFLE_MAX_ATTEMPTS, SYMBOL_COUNT, TILES_PER_SYMBOL } from './types';
import type { LayerIndex, LayoutDefinition, SymbolId, Tile, TileKey } from './types';
import type { TilePair } from './rules';

/* ── deterministic RNG ──────────────────────────────────────────────── */

/** A tiny seeded PRNG. Same seed ⇒ same sequence, forever. */
export interface Rng {
  /** Float in `[0, 1)`. */
  next(): number;
  /** Integer in `[0, maxExclusive)`. Returns 0 when `maxExclusive <= 0`. */
  int(maxExclusive: number): number;
}

/** mulberry32 — 32-bit, fast, and good enough for tile shuffling. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wrap {@link mulberry32} in the {@link Rng} interface. */
export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    next,
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.min(maxExclusive - 1, Math.floor(next() * maxExclusive));
    },
  };
}

/** Fisher–Yates, in place, driven by `rng`. Returns the same array. */
export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

/* ── pair queue ─────────────────────────────────────────────────────── */

/**
 * One entry per **pair**: each symbol id appears exactly `TILES_PER_SYMBOL / 2`
 * times, giving `SYMBOL_COUNT × 2 = 68` entries → 136 tiles.
 */
export function buildPairQueue(): SymbolId[] {
  const queue: SymbolId[] = [];
  const pairsPerSymbol = TILES_PER_SYMBOL / 2;
  for (let id = 1; id <= SYMBOL_COUNT; id++) {
    for (let i = 0; i < pairsPerSymbol; i++) queue.push(id);
  }
  return queue;
}

/* ── reverse play ───────────────────────────────────────────────────── */

/** The output of a successful reverse-play pass. */
export interface ReversePlayResult {
  assignment: Map<TileKey, SymbolId>;
  solution: TilePair[];
}

/**
 * Assign symbols to `slots` by repeatedly removing a legal pair.
 *
 * @param slots    The tile keys to fill.
 * @param queue    One symbol id per pair; length must be `slots.length / 2`.
 * @param maxLayer Highest layer index (bounds the "covered" scan).
 * @param rng      Seeded RNG.
 * @returns The assignment plus a valid clearing order, or `null` when the
 *          geometry reaches a state with fewer than two free tiles (the caller
 *          retries with a different random removal order).
 */
export function reversePlay(
  slots: readonly TileKey[],
  queue: readonly SymbolId[],
  maxLayer: LayerIndex,
  rng: Rng,
): ReversePlayResult | null {
  if (slots.length % 2 !== 0) return null;
  if (queue.length !== slots.length / 2) return null;

  const occupied = new Set<TileKey>(slots);
  const assignment = new Map<TileKey, SymbolId>();
  const solution: TilePair[] = [];
  let queueIndex = 0;

  while (occupied.size > 0) {
    // Deterministic candidate order keeps runs reproducible.
    const free = [...occupied].filter((k) => isFreeKey(occupied, k, maxLayer)).sort(compareKeys);
    if (free.length < 2) return null;

    const aIndex = rng.int(free.length);
    const a = free[aIndex];
    let bIndex = rng.int(free.length - 1);
    if (bIndex >= aIndex) bIndex++;
    const b = free[bIndex];

    const symbolId = queue[queueIndex++];
    assignment.set(a, symbolId);
    assignment.set(b, symbolId);
    solution.push([a, b]);
    occupied.delete(a);
    occupied.delete(b);
  }

  return queueIndex === queue.length ? { assignment, solution } : null;
}

/* ── deals ──────────────────────────────────────────────────────────── */

/** A freshly dealt, provably solvable board. */
export interface Deal {
  tiles: Record<TileKey, Tile>;
  /** A valid full clearing order — the proof of solvability. */
  solution: TilePair[];
  seed: number;
  /** `true` when the retry budget was exhausted and the safety net was used. */
  fellBack: boolean;
}

/** Materialise a tile record from an assignment map. */
function tilesFromAssignment(
  layout: LayoutDefinition,
  assignment: ReadonlyMap<TileKey, SymbolId>,
): Record<TileKey, Tile> {
  const tiles: Record<TileKey, Tile> = {};
  for (const p of layout.positions) {
    const k = key(p.x, p.y, p.layer);
    tiles[k] = {
      key: k,
      x: p.x,
      y: p.y,
      layer: p.layer,
      symbolId: assignment.get(k) ?? 0,
      removed: false,
    };
  }
  return tiles;
}

/**
 * Total-function safety net: pair the slots up in grid order.
 *
 * Pairs stay matched, so the board is at least *consistent*, but this makes **no
 * solvability claim**. It is unreachable for the four shipped layouts (reverse
 * play succeeds on the first attempt for every seed tested) and exists only so
 * {@link generateSolvable} can never throw or loop forever.
 */
function fallbackDeal(layout: LayoutDefinition, seed: number): Deal {
  const slots = layout.positions.map((p) => key(p.x, p.y, p.layer));
  const queue = buildPairQueue();
  const assignment = new Map<TileKey, SymbolId>();

  for (let pair = 0; pair < queue.length; pair++) {
    const a = slots[pair * 2];
    const b = slots[pair * 2 + 1];
    if (a === undefined || b === undefined) break;
    assignment.set(a, queue[pair]);
    assignment.set(b, queue[pair]);
  }

  return {
    tiles: tilesFromAssignment(layout, assignment),
    solution: [],
    seed,
    fellBack: true,
  };
}

/**
 * Deal a provably solvable board.
 *
 * @param layout      The board shape.
 * @param seed        Deterministic seed — same `(layout, seed)` ⇒ same board.
 * @param maxAttempts Bounded retry budget (never loops forever).
 */
export function generateSolvable(
  layout: LayoutDefinition,
  seed: number,
  maxAttempts: number = SHUFFLE_MAX_ATTEMPTS,
): Deal {
  const rng = createRng(seed);
  const slots = layout.positions.map((p) => key(p.x, p.y, p.layer));
  const baseQueue = buildPairQueue();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const queue = shuffleInPlace(baseQueue.slice(), rng);
    const result = reversePlay(slots, queue, layout.maxLayer, rng);
    if (result) {
      return {
        tiles: tilesFromAssignment(layout, result.assignment),
        solution: result.solution,
        seed,
        fellBack: false,
      };
    }
  }

  return fallbackDeal(layout, seed);
}

/* ── verification & independent solving (used by tests) ─────────────── */

/**
 * Replay `solution` against `tiles` and confirm it is legal and complete.
 *
 * This is a **proof**, not a heuristic: it asserts every pair is free and
 * symbol-matched at the exact moment it is played, and that the board ends empty.
 * The test suite runs it against every layout × many seeds.
 */
export function verifySolution(
  tiles: Record<TileKey, Tile>,
  solution: readonly TilePair[],
  maxLayer: LayerIndex,
): boolean {
  const occupied = occupiedFrom(tiles);

  for (const [a, b] of solution) {
    if (!occupied.has(a) || !occupied.has(b)) return false;
    if (!isFreeKey(occupied, a, maxLayer)) return false;
    if (!isFreeKey(occupied, b, maxLayer)) return false;
    if (tiles[a].symbolId !== tiles[b].symbolId) return false;
    occupied.delete(a);
    occupied.delete(b);
  }

  return occupied.size === 0;
}

/**
 * A solver that knows **nothing** about the generated solution: randomized greedy
 * with restarts. Its only inputs are the tiles and the rules.
 *
 * Used by the tests as an independent second opinion — if this clears a board,
 * the board is solvable by a method that shares no code path with the generator.
 *
 * @param attempts Number of randomized restarts before giving up.
 */
export function solveIndependently(
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
  seed: number,
  attempts = 200,
): boolean {
  const rng = createRng(seed);
  const allKeys = Object.keys(tiles);

  for (let attempt = 0; attempt < attempts; attempt++) {
    const occupied = new Set<TileKey>(allKeys);
    let guard = 0;

    while (occupied.size > 0) {
      if (++guard > allKeys.length) break; // no infinite loops, ever
      const matches = findAllMatchesOn(occupied, tiles, maxLayer);
      if (matches.length === 0) break;
      const pick = matches[rng.int(matches.length)];
      occupied.delete(pick[0]);
      occupied.delete(pick[1]);
    }

    if (occupied.size === 0) return true;
  }

  return false;
}

/** `findAllMatches` against an explicit occupancy set (subset of a board). */
function findAllMatchesOn(
  occupied: ReadonlySet<TileKey>,
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
): TilePair[] {
  const subset: Record<TileKey, Tile> = {};
  for (const k of occupied) subset[k] = tiles[k];
  return findAllMatches(subset, maxLayer);
}

/* ── shuffle ────────────────────────────────────────────────────────── */

/** The result of a shuffle attempt. */
export interface ShuffleOutcome {
  ok: boolean;
  /** New tile record (a fresh object; the input is never mutated). */
  tiles: Record<TileKey, Tile>;
  /** How many tiles were re-symboled. */
  moved: number;
  /** A valid clearing order for the remaining tiles, when fully solvable. */
  solution: TilePair[];
  /** `true` when the board was only guaranteed a single legal move. */
  partial: boolean;
  /** Machine-readable reason when `ok` is false. */
  reason?: 'too-few-tiles' | 'odd-count';
}

/** Non-mutating copy of a tile record. */
function cloneTiles(tiles: Record<TileKey, Tile>): Record<TileKey, Tile> {
  const next: Record<TileKey, Tile> = {};
  for (const k in tiles) next[k] = { ...tiles[k] };
  return next;
}

/**
 * Reshuffle every remaining tile while preserving the multiset exactly.
 *
 * Guarantees:
 *  - **Nothing is created or lost** — the symbol multiset of the live tiles is
 *    identical before and after.
 *  - **At least one legal move exists afterwards** (the first entry of
 *    `solution`, or the explicit pairing in the partial fallback).
 *  - **Usually fully solvable** — `solution` is a complete clearing order for the
 *    remaining tiles. If the retry budget is exhausted, the fallback still
 *    guarantees a legal move but only `partial: true` solvability.
 *  - **Never loops forever** — the attempt count is bounded.
 *
 * @param tiles      Current board.
 * @param maxLayer   Highest layer index.
 * @param seed       Deterministic seed.
 * @param maxAttempts Bounded retry budget.
 */
export function shuffleRemaining(
  tiles: Record<TileKey, Tile>,
  maxLayer: LayerIndex,
  seed: number,
  maxAttempts: number = SHUFFLE_MAX_ATTEMPTS,
): ShuffleOutcome {
  const occupied = occupiedFrom(tiles);
  const live = [...occupied].sort(compareKeys);

  if (live.length < 2) {
    return { ok: true, tiles: cloneTiles(tiles), moved: 0, solution: [], partial: false, reason: 'too-few-tiles' };
  }

  // Histogram of the live multiset — the thing that must be preserved.
  const counts = new Map<SymbolId, number>();
  for (const k of live) {
    counts.set(tiles[k].symbolId, (counts.get(tiles[k].symbolId) ?? 0) + 1);
  }
  for (const [, count] of counts) {
    if (count % 2 !== 0) {
      return { ok: false, tiles: cloneTiles(tiles), moved: 0, solution: [], partial: false, reason: 'odd-count' };
    }
  }

  const queue: SymbolId[] = [];
  for (const symbolId of [...counts.keys()].sort((a, b) => a - b)) {
    const pairs = (counts.get(symbolId) ?? 0) / 2;
    for (let i = 0; i < pairs; i++) queue.push(symbolId);
  }

  const rng = createRng(seed);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffledQueue = shuffleInPlace(queue.slice(), rng);
    const result = reversePlay(live, shuffledQueue, maxLayer, rng);
    if (!result) continue;

    const next = cloneTiles(tiles);
    for (const [k, symbolId] of result.assignment) next[k] = { ...next[k], symbolId };
    return {
      ok: true,
      tiles: next,
      moved: live.length,
      solution: result.solution,
      partial: false,
    };
  }

  // Fallback: still guarantee a legal move, and still preserve the multiset.
  const next = cloneTiles(tiles);
  const free = live.filter((k) => isFreeKey(occupied, k, maxLayer));
  if (free.length < 2) {
    return { ok: false, tiles: next, moved: 0, solution: [], partial: false, reason: 'odd-count' };
  }

  const [a, b] = free;
  const donor = [...counts.keys()].sort((x, y) => x - y).find((s) => (counts.get(s) ?? 0) >= 2);
  if (donor === undefined) {
    return { ok: false, tiles: next, moved: 0, solution: [], partial: false, reason: 'odd-count' };
  }

  const pool: SymbolId[] = [];
  for (const symbolId of [...counts.keys()].sort((x, y) => x - y)) {
    const copies = (counts.get(symbolId) ?? 0) - (symbolId === donor ? 2 : 0);
    for (let i = 0; i < copies; i++) pool.push(symbolId);
  }
  shuffleInPlace(pool, rng);

  next[a] = { ...next[a], symbolId: donor };
  next[b] = { ...next[b], symbolId: donor };
  let cursor = 0;
  for (const k of live) {
    if (k === a || k === b) continue;
    next[k] = { ...next[k], symbolId: pool[cursor++] };
  }

  return { ok: true, tiles: next, moved: live.length, solution: [[a, b]], partial: true };
}

/** Highest layer index referenced by a set of keys. */
export function maxLayerOfKeys(keys: readonly TileKey[]): LayerIndex {
  let max = 0;
  for (const k of keys) {
    const { layer } = parseKey(k);
    if (layer > max) max = layer;
  }
  return max;
}
