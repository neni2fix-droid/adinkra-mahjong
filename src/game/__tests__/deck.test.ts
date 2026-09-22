import { describe, expect, it } from 'vitest';
import { LAYOUT_BY_ID } from '../../data/layouts';
import { countBySymbol, remainingCount } from '../board';
import {
  buildPairQueue,
  createRng,
  generateSolvable,
  mulberry32,
  shuffleInPlace,
  solveIndependently,
  verifySolution,
} from '../deck';
import { TILE_COUNT } from '../types';

describe('deck', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it('createRng.int respects bounds', () => {
    const rng = createRng(1);
    for (let i = 0; i < 50; i++) {
      const v = rng.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('shuffleInPlace produces permutations', () => {
    const rng = createRng(7);
    const arr = [1, 2, 3, 4, 5];
    shuffleInPlace(arr, rng);
    expect(arr).toHaveLength(5);
    expect(new Set(arr)).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('buildPairQueue has correct length', () => {
    const q = buildPairQueue();
    expect(q.length).toBe(TILE_COUNT / 2);
    const counts = new Map<number, number>();
    for (const id of q) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (let id = 1; id <= 34; id++) {
      expect(counts.get(id)).toBe(2);
    }
  });

  it.each([
    ['classic-turtle', LAYOUT_BY_ID['classic-turtle']],
    ['diamond', LAYOUT_BY_ID['diamond']],
    ['ghana-star', LAYOUT_BY_ID['ghana-star']],
  ] as const)('generateSolvable for %s — 136 tiles, each symbol 4x', (_name, layout) => {
    const deal = generateSolvable(layout, 123);
    expect(Object.keys(deal.tiles).length).toBe(TILE_COUNT);
    expect(remainingCount(deal.tiles)).toBe(TILE_COUNT);

    const counts = countBySymbol(deal.tiles);
    expect(counts.size).toBe(34);
    for (let id = 1; id <= 34; id++) {
      expect(counts.get(id)).toBe(4);
    }
  });

  it.each([
    ['classic-turtle', LAYOUT_BY_ID['classic-turtle']],
    ['diamond', LAYOUT_BY_ID['diamond']],
    ['ghana-star', LAYOUT_BY_ID['ghana-star']],
  ] as const)('verifySolution confirms generated solution for %s', (_name, layout) => {
    const deal = generateSolvable(layout, 456);
    expect(verifySolution(deal.tiles, deal.solution, layout.maxLayer)).toBe(true);
  });

  it.each([
    ['classic-turtle', LAYOUT_BY_ID['classic-turtle']],
    ['diamond', LAYOUT_BY_ID['diamond']],
  ] as const)('independent solver clears %s', (_name, layout) => {
    const deal = generateSolvable(layout, 789);
    expect(solveIndependently(deal.tiles, layout.maxLayer, 999)).toBe(true);
  });
});
