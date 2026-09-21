import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUT_ID,
  LAYOUTS,
  LAYOUT_BY_ID,
  assertTileCount,
  fromRows,
  layoutById,
  rect,
} from '../layouts';
import { TILE_COUNT } from '../../game/types';
import type { BoardPosition, LayoutDefinition, LayoutId } from '../../game/types';

/** Per-layer tile counts mandated by architecture §4.7. */
const EXPECTED_LAYER_COUNTS: Record<LayoutId, number[]> = {
  'classic-turtle': [92, 28, 16],
  diamond: [84, 36, 16],
  'ghana-star': [72, 48, 16],
  'compact-mobile': [88, 36, 12],
};

const EXPECTED_IDS: LayoutId[] = ['classic-turtle', 'diamond', 'ghana-star', 'compact-mobile'];

function groupByLayer(positions: readonly BoardPosition[]): Map<number, BoardPosition[]> {
  const byLayer = new Map<number, BoardPosition[]>();
  for (const p of positions) {
    const bucket = byLayer.get(p.layer);
    if (bucket) {
      bucket.push(p);
    } else {
      byLayer.set(p.layer, [p]);
    }
  }
  return byLayer;
}

describe('data/layouts', () => {
  it('ships exactly the four documented layouts, in order', () => {
    expect(LAYOUTS).toHaveLength(4);
    expect(LAYOUTS.map((l) => l.id)).toEqual(EXPECTED_IDS);
    expect(Object.keys(LAYOUT_BY_ID).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  describe.each(EXPECTED_IDS)('layout %s', (id) => {
    const layout = LAYOUT_BY_ID[id];

    it('totals exactly 136 tiles', () => {
      expect(layout.positions).toHaveLength(TILE_COUNT);
      expect(layout.positions).toHaveLength(136);
      expect(layout.tileCount).toBe(136);
    });

    it('is a three-layer board with maxLayer 2', () => {
      expect(layout.layers).toBe(3);
      expect(layout.maxLayer).toBe(2);
    });

    it('has no duplicate (layer, x, y) position', () => {
      const seen = new Set<string>();
      let duplicates = 0;
      for (const p of layout.positions) {
        const key = `${p.layer}:${p.x}:${p.y}`;
        if (seen.has(key)) {
          duplicates += 1;
        }
        seen.add(key);
      }
      expect(duplicates).toBe(0);
      expect(seen.size).toBe(layout.positions.length);
    });

    it('matches the documented per-layer counts', () => {
      const byLayer = groupByLayer(layout.positions);
      const counts = [0, 1, 2].map((layer) => (byLayer.get(layer) ?? []).length);
      expect(counts).toEqual(EXPECTED_LAYER_COUNTS[id]);
      // The per-layer counts must themselves sum to the board total.
      expect(counts.reduce((a, b) => a + b, 0)).toBe(136);
    });

    it('uses only non-negative integer coordinates', () => {
      for (const p of layout.positions) {
        expect(Number.isInteger(p.x)).toBe(true);
        expect(Number.isInteger(p.y)).toBe(true);
        expect(Number.isInteger(p.layer)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThan(layout.cols);
        expect(p.y).toBeLessThan(layout.rows);
      }
    });

    it('nests every upper layer inside the layer below it', () => {
      const byLayer = groupByLayer(layout.positions);
      for (let layer = 1; layer < layout.layers; layer += 1) {
        const below = new Set((byLayer.get(layer - 1) ?? []).map((p) => `${p.x},${p.y}`));
        for (const p of byLayer.get(layer) ?? []) {
          expect(below.has(`${p.x},${p.y}`)).toBe(true);
        }
      }
    });
  });

  describe('assertTileCount', () => {
    it('returns nothing for a valid layout', () => {
      expect(() => assertTileCount(LAYOUT_BY_ID['classic-turtle'], 136)).not.toThrow();
    });

    it('throws when the tile count is wrong', () => {
      const broken: LayoutDefinition = {
        ...LAYOUT_BY_ID['classic-turtle'],
        positions: LAYOUT_BY_ID['classic-turtle'].positions.slice(0, 135),
        tileCount: 135,
      };
      expect(() => assertTileCount(broken, 136)).toThrow(/135 tiles; expected 136/);
    });

    it('throws when the cached tileCount disagrees with the positions', () => {
      const broken: LayoutDefinition = {
        ...LAYOUT_BY_ID['classic-turtle'],
        tileCount: 999,
      };
      expect(() => assertTileCount(broken, 136)).toThrow(/caches tileCount 999/);
    });
  });

  describe('layoutById', () => {
    it('resolves every known id', () => {
      for (const id of EXPECTED_IDS) {
        expect(layoutById(id).id).toBe(id);
      }
    });

    it('falls back to the default layout for an unknown id', () => {
      expect(layoutById('not-a-layout' as LayoutId).id).toBe(DEFAULT_LAYOUT_ID);
    });
  });

  describe('geometry helpers', () => {
    it('rect() produces a w × h block at the right layer', () => {
      const cells = rect(2, 3, 2, 2, 1);
      expect(cells).toHaveLength(4);
      expect(cells).toEqual([
        { x: 2, y: 3, layer: 1 },
        { x: 3, y: 3, layer: 1 },
        { x: 2, y: 4, layer: 1 },
        { x: 3, y: 4, layer: 1 },
      ]);
    });

    it('fromRows() honours the row pattern and offsets', () => {
      const cells = fromRows(['10', '01'], 0, 5, 7);
      expect(cells).toEqual([
        { x: 5, y: 7, layer: 0 },
        { x: 6, y: 8, layer: 0 },
      ]);
    });

    it('fromRows() with no offsets starts at the origin', () => {
      expect(fromRows(['111'], 2)).toEqual([
        { x: 0, y: 0, layer: 2 },
        { x: 1, y: 0, layer: 2 },
        { x: 2, y: 0, layer: 2 },
      ]);
    });
  });
});
