import { describe, expect, it } from 'vitest';
import { LAYOUT_BY_ID } from '../../data/layouts';
import {
  compareKeys,
  compareTiles,
  emptyTiles,
  freeKeys,
  isFree,
  isFreeKey,
  key,
  liveKeys,
  liveTiles,
  occupiedFrom,
  parseKey,
  remainingCount,
} from '../board';
import type { Tile } from '../types';

describe('board', () => {
  const positions = LAYOUT_BY_ID['classic-turtle'].positions;
  const tiles = emptyTiles(positions);

  it('key round-trips through parseKey', () => {
    const k = key(3, 4, 2);
    expect(parseKey(k)).toEqual({ x: 3, y: 4, layer: 2 });
  });

  it('emptyTiles creates un-dealt tiles for every position', () => {
    expect(Object.keys(tiles).length).toBe(136);
    expect(tiles[key(0, 0, 0)]).toBeDefined();
    expect(tiles[key(0, 0, 0)].symbolId).toBe(0);
    expect(tiles[key(0, 0, 0)].removed).toBe(false);
  });

  it('occupiedFrom returns all keys when nothing is removed', () => {
    const occ = occupiedFrom(tiles);
    expect(occ.size).toBe(136);
  });

  it('remainingCount is 136 for a fresh board', () => {
    expect(remainingCount(tiles)).toBe(136);
  });

  it('liveTiles are sorted by (layer, y, x)', () => {
    const live = liveTiles(tiles);
    expect(live.length).toBe(136);
    for (let i = 1; i < live.length; i++) {
      expect(compareTiles(live[i - 1], live[i])).toBeLessThanOrEqual(0);
    }
  });

  it('liveKeys match liveTiles', () => {
    expect(liveKeys(tiles)).toEqual(liveTiles(tiles).map((t) => t.key));
  });

  it('corner tile is free on a flat board', () => {
    const occ = occupiedFrom(tiles);
    expect(isFree(occ, 0, 0, 0, 2)).toBe(true);
  });

  it('interior tile is blocked when surrounded', () => {
    const occ = occupiedFrom(tiles);
    expect(isFree(occ, 5, 3, 0, 2)).toBe(false);
  });

  it('tile under a higher layer is blocked', () => {
    const occ = occupiedFrom(tiles);
    expect(isFree(occ, 4, 2, 0, 2)).toBe(false);
  });

  it('top-layer tile is free when at edge', () => {
    const occ = occupiedFrom(tiles);
    expect(isFree(occ, 4, 2, 2, 2)).toBe(true);
  });

  it('isFreeKey delegates correctly', () => {
    const occ = occupiedFrom(tiles);
    const k0 = key(0, 0, 0);
    expect(isFreeKey(occ, k0, 2)).toBe(isFree(occ, 0, 0, 0, 2));
  });

  it('freeKeys excludes interior blocked tiles', () => {
    const occ = occupiedFrom(tiles);
    const free = freeKeys(occ, 2);
    expect(free.length).toBeLessThan(136);
    for (const k of free) {
      expect(isFreeKey(occ, k, 2)).toBe(true);
    }
  });

  it('compareKeys uses (layer, y, x)', () => {
    expect(compareKeys(key(0, 0, 0), key(0, 0, 1))).toBeLessThan(0);
    expect(compareKeys(key(0, 0, 1), key(0, 1, 1))).toBeLessThan(0);
    expect(compareKeys(key(0, 1, 1), key(1, 1, 1))).toBeLessThan(0);
  });

  it('parseKey throws on malformed input', () => {
    expect(() => parseKey('bad')).toThrow();
    expect(() => parseKey('1:2')).toThrow();
  });

  it('remainingCount drops after marking tiles removed', () => {
    const t: Record<string, Tile> = { ...tiles };
    const k = Object.keys(t)[0];
    t[k] = { ...t[k], removed: true };
    expect(remainingCount(t)).toBe(135);
  });
});
