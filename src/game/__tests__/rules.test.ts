import { describe, expect, it } from 'vitest';
import { LAYOUT_BY_ID } from '../../data/layouts';
import { generateSolvable } from '../deck';
import { findAllMatches, findHint, findMatch, hasMoves, select } from '../rules';
import type { TileKey } from '../types';

describe('rules', () => {
  const layout = LAYOUT_BY_ID['classic-turtle'];

  it('findMatch returns a free pair with same symbol', () => {
    const deal = generateSolvable(layout, 111);
    const match = findMatch(deal.tiles, layout.maxLayer);
    expect(match).not.toBeNull();
    if (match) {
      expect(deal.tiles[match[0]].symbolId).toBe(deal.tiles[match[1]].symbolId);
    }
  });

  it('hasMoves is true on a fresh solvable board', () => {
    const deal = generateSolvable(layout, 222);
    expect(hasMoves(deal.tiles, layout.maxLayer)).toBe(true);
  });

  it('findAllMatches returns only free symbol-matched pairs', () => {
    const deal = generateSolvable(layout, 333);
    const matches = findAllMatches(deal.tiles, layout.maxLayer);
    expect(matches.length).toBeGreaterThan(0);
    for (const [a, b] of matches) {
      expect(deal.tiles[a].symbolId).toBe(deal.tiles[b].symbolId);
    }
  });

  it('findHint returns a match from findAllMatches', () => {
    const deal = generateSolvable(layout, 444);
    const hint = findHint(deal.tiles, layout.maxLayer);
    const all = findAllMatches(deal.tiles, layout.maxLayer);
    if (hint) {
      const found = all.some(([a, b]) =>
        (a === hint[0] && b === hint[1]) || (a === hint[1] && b === hint[0]),
      );
      expect(found).toBe(true);
    }
  });

  it('select: tap free tile with none selected → selected', () => {
    const deal = generateSolvable(layout, 555);
    const match = findMatch(deal.tiles, layout.maxLayer);
    expect(match).not.toBeNull();
    if (!match) return;
    const result = select(deal.tiles, null, match[0], layout.maxLayer);
    expect(result.type).toBe('selected');
    if (result.type === 'selected') expect(result.key).toBe(match[0]);
  });

  it('select: tap same tile again → deselected', () => {
    const deal = generateSolvable(layout, 666);
    const match = findMatch(deal.tiles, layout.maxLayer);
    expect(match).not.toBeNull();
    if (!match) return;
    const r1 = select(deal.tiles, null, match[0], layout.maxLayer);
    expect(r1.type).toBe('selected');
    const r2 = select(deal.tiles, match[0], match[0], layout.maxLayer);
    expect(r2.type).toBe('deselected');
  });

  it('select: tap matching free tile → matched', () => {
    const deal = generateSolvable(layout, 777);
    const match = findMatch(deal.tiles, layout.maxLayer);
    expect(match).not.toBeNull();
    if (!match) return;
    const r1 = select(deal.tiles, null, match[0], layout.maxLayer);
    expect(r1.type).toBe('selected');
    const r2 = select(deal.tiles, match[0], match[1], layout.maxLayer);
    expect(r2.type).toBe('matched');
  });

  it('select: tap non-matching free tile → invalid', () => {
    const deal = generateSolvable(layout, 888);
    const matches = findAllMatches(deal.tiles, layout.maxLayer);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    // Find two matches with different symbols
    const m0 = matches[0];
    const m1 = matches.find((m) => deal.tiles[m[0]].symbolId !== deal.tiles[m0[0]].symbolId);
    expect(m1).toBeDefined();
    if (!m1) return;
    const [a] = m0;
    const [c] = m1;
    const r1 = select(deal.tiles, null, a, layout.maxLayer);
    expect(r1.type).toBe('selected');
    const r2 = select(deal.tiles, a, c, layout.maxLayer);
    expect(r2.type).toBe('invalid');
  });

  it('select: tap blocked tile → blocked', () => {
    const deal = generateSolvable(layout, 999);
    const allKeys = Object.keys(deal.tiles);
    const free = new Set(findAllMatches(deal.tiles, layout.maxLayer).flat());
    const blocked = allKeys.find((k) => !free.has(k as TileKey));
    expect(blocked).toBeDefined();
    if (!blocked) return;
    const r = select(deal.tiles, null, blocked, layout.maxLayer);
    expect(r.type).toBe('blocked');
  });
});
