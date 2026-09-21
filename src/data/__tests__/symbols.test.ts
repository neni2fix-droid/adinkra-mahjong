import { describe, expect, it } from 'vitest';

import { FAMILY_LABELS, SYMBOLS, SYMBOL_BY_ID, symbolById } from '../symbols';
import { SVG_ASSET_COUNT, SVG_BY_PATH, getSymbolSvg } from '../svg-registry';
import { SYMBOL_COUNT, TILES_PER_SYMBOL } from '../../game/types';
import type { SymbolFamily } from '../../game/types';

const VALID_FAMILIES: SymbolFamily[] = ['wisdom', 'strength', 'unity', 'life'];

describe('data/symbols', () => {
  it('defines exactly 34 symbols', () => {
    expect(SYMBOLS).toHaveLength(SYMBOL_COUNT);
    expect(SYMBOLS).toHaveLength(34);
    expect(Object.keys(SYMBOL_BY_ID)).toHaveLength(34);
  });

  it('uses unique ids, slugs and names', () => {
    expect(new Set(SYMBOLS.map((s) => s.id)).size).toBe(34);
    expect(new Set(SYMBOLS.map((s) => s.slug)).size).toBe(34);
    expect(new Set(SYMBOLS.map((s) => s.name)).size).toBe(34);
  });

  it('numbers ids contiguously from 1 to 34', () => {
    expect(SYMBOLS.map((s) => s.id)).toEqual(
      Array.from({ length: 34 }, (_, i) => i + 1),
    );
  });

  it('assigns only known families, balanced 9/8/8/9', () => {
    const counts: Record<SymbolFamily, number> = { wisdom: 0, strength: 0, unity: 0, life: 0 };
    for (const s of SYMBOLS) {
      expect(VALID_FAMILIES).toContain(s.family);
      counts[s.family] += 1;
    }
    expect(counts).toEqual({ wisdom: 9, strength: 8, unity: 8, life: 9 });
  });

  it('labels every family', () => {
    for (const family of VALID_FAMILIES) {
      expect(FAMILY_LABELS[family]).toBeTruthy();
    }
  });

  it('gives every symbol a non-empty accessible label and meaning', () => {
    for (const s of SYMBOLS) {
      expect(s.accessibleLabel.trim().length).toBeGreaterThan(0);
      expect(s.meaning.trim().length).toBeGreaterThan(0);
      expect(s.accessibleLabel).toContain(s.name);
    }
  });

  it('keeps each slug identical to its asset filename stem', () => {
    for (const s of SYMBOLS) {
      expect(s.svgAssetPath).toBe(`../assets/symbols/${s.slug}.svg`);
    }
  });

  // ── the "all 34 asset paths resolve" acceptance criterion ────────────────
  it('resolves every svgAssetPath to real inline SVG starting with <svg', () => {
    for (const s of SYMBOLS) {
      const svg = getSymbolSvg(s.svgAssetPath);
      expect(typeof svg).toBe('string');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
    }
  });

  it('ships exactly 34 distinct SVG files on disk', () => {
    expect(SVG_ASSET_COUNT).toBe(34);
    expect(Object.keys(SVG_BY_PATH)).toHaveLength(34);
    const paths = SYMBOLS.map((s) => s.svgAssetPath);
    expect(new Set(paths).size).toBe(34);
    for (const path of paths) {
      expect(Object.prototype.hasOwnProperty.call(SVG_BY_PATH, path)).toBe(true);
    }
  });

  it('draws every symbol with a distinct silhouette', () => {
    const drawings = SYMBOLS.map((s) => getSymbolSvg(s.svgAssetPath));
    expect(new Set(drawings).size).toBe(34);
  });

  it('themes every SVG through currentColor with real drawing primitives', () => {
    for (const s of SYMBOLS) {
      const svg = getSymbolSvg(s.svgAssetPath);
      expect(svg).toContain('currentColor');
      expect(svg).toContain('viewBox="0 0 100 100"');
      expect(/<(path|circle|rect|ellipse|polygon|line|polyline)\b/.test(svg)).toBe(true);
    }
  });

  it('throws a helpful error when an asset path is unknown', () => {
    expect(() => getSymbolSvg('../assets/symbols/does-not-exist.svg')).toThrow(
      /SVG asset not found/,
    );
  });

  describe('symbolById', () => {
    it('returns the symbol for a known id', () => {
      expect(symbolById(1)?.slug).toBe('gye-nyame');
      expect(symbolById(34)?.slug).toBe('dame-dame');
    });

    it('returns null for an unknown id', () => {
      expect(symbolById(999)).toBeNull();
    });
  });

  it('pairs with the deck constants to make a full board', () => {
    expect(SYMBOL_COUNT * TILES_PER_SYMBOL).toBe(136);
  });
});
